<?php

namespace App\Console\Commands;

use App\Models\LocationAqi;
use App\Services\AqiLabelService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RefreshAqiCommand extends Command
{
    protected $signature = 'app:refresh-aqi {--location=all : Slug of location to refresh, or "all"}';
    protected $description = 'Fetch fresh AQI data from Google Air Quality API and cache it in the database.';

    public function handle(): int
    {
        $apiKey = config('services.google_air_quality.key') ?: \Illuminate\Support\Facades\Cache::get('google_aqi_api_key');
        $locations = LocationAqi::supportedLocations();
        $targetSlug = $this->option('location');

        if ($targetSlug !== 'all') {
            if (!array_key_exists($targetSlug, $locations)) {
                $this->error("Unknown location slug: {$targetSlug}");
                return self::FAILURE;
            }
            $locations = [$targetSlug => $locations[$targetSlug]];
        }

        foreach ($locations as $slug => $meta) {
            $this->info("Refreshing AQI for: {$meta['location_name']} ...");

            $record = LocationAqi::firstOrNew(['location_slug' => $slug]);

            // ---- Google Air Quality API ----------------------------
            if ($apiKey) {
                try {
                    $response = Http::timeout(10)->post(
                        "https://airquality.googleapis.com/v1/currentConditions:lookup?key={$apiKey}",
                        [
                            'universalAqi' => true,
                            'location' => [
                                'latitude' => $meta['latitude'],
                                'longitude' => $meta['longitude'],
                            ],
                            'extraComputations' => ['POLLUTANT_CONCENTRATION'],
                        ]
                    );

                    if ($response->successful()) {
                        $body = $response->json();
                        $indexes = $body['indexes'] ?? [];
                        $pollutants = collect($body['pollutants'] ?? []);

                        // Universal AQI from Google
                        $uaqi = collect($indexes)->firstWhere('code', 'uaqi');
                        $aqiVal = $uaqi['aqiDisplay'] ?? ($uaqi['aqi'] ?? null);

                        // Fallback: US AQI
                        if (!$aqiVal) {
                            $usAqi = collect($indexes)->firstWhere('code', 'usa_epa');
                            $aqiVal = $usAqi['aqiDisplay'] ?? ($usAqi['aqi'] ?? null);
                        }

                        $pm25 = $pollutants->firstWhere('code', 'pm25');
                        $pm10 = $pollutants->firstWhere('code', 'pm10');

                        $record->fill([
                            'location_name' => $meta['location_name'],
                            'latitude' => $meta['latitude'],
                            'longitude' => $meta['longitude'],
                            'aqi' => (int) ($aqiVal ?? 0),
                            'status' => AqiLabelService::label((int) ($aqiVal ?? 0)),
                            'pm25' => $pm25['concentration']['value'] ?? null,
                            'pm10' => $pm10['concentration']['value'] ?? null,
                            'source' => 'Google Air Quality API',
                            'last_updated_at' => now(),
                            'raw_json' => $body,
                        ]);
                        $record->save();

                        $this->info("  ✓ AQI {$record->aqi} ({$record->status}) from Google API");
                        Log::info("[RefreshAqi] {$slug} updated via Google API", ['aqi' => $record->aqi]);
                        continue;
                    } else {
                        $this->warn("  Google API returned {$response->status()} — falling back to Open-Meteo");
                    }
                } catch (\Throwable $e) {
                    $this->warn("  Google API error: {$e->getMessage()} — falling back to Open-Meteo");
                    Log::warning("[RefreshAqi] Google API failed for {$slug}", ['error' => $e->getMessage()]);
                }
            }

            // ---- Open-Meteo Air Quality (free, no key needed) -----
            try {
                $response = Http::timeout(10)->get('https://air-quality-api.open-meteo.com/v1/air-quality', [
                    'latitude' => $meta['latitude'],
                    'longitude' => $meta['longitude'],
                    'hourly' => 'pm10,pm2_5,us_aqi',
                    'forecast_days' => 1,
                    'timezone' => 'Asia/Karachi',
                ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $hourly = $body['hourly'] ?? [];

                    // Grab the latest non-null hour
                    $hours = $hourly['time'] ?? [];
                    $aqiArr = $hourly['us_aqi'] ?? [];
                    $pm25Arr = $hourly['pm2_5'] ?? [];
                    $pm10Arr = $hourly['pm10'] ?? [];

                    // Walk backward from last hour to find a valid reading
                    $aqiVal = null;
                    $pm25Val = null;
                    $pm10Val = null;
                    for ($i = count($hours) - 1; $i >= 0; $i--) {
                        if (!is_null($aqiArr[$i] ?? null)) {
                            $aqiVal = (int) $aqiArr[$i];
                            $pm25Val = $pm25Arr[$i] ?? null;
                            $pm10Val = $pm10Arr[$i] ?? null;
                            break;
                        }
                    }

                    $record->fill([
                        'location_name' => $meta['location_name'],
                        'latitude' => $meta['latitude'],
                        'longitude' => $meta['longitude'],
                        'aqi' => $aqiVal ?? 42,
                        'status' => AqiLabelService::label($aqiVal ?? 42),
                        'pm2_5' => $pm25Val,
                        'pm10' => $pm10Val,
                        'source' => 'Open-Meteo (Free Fallback)',
                        'last_updated_at' => now(),
                        'raw_json' => $body,
                    ]);
                    $record->save();

                    $this->info("  ✓ AQI {$record->aqi} ({$record->status}) from Open-Meteo");
                    Log::info("[RefreshAqi] {$slug} updated via Open-Meteo", ['aqi' => $record->aqi]);
                    continue;
                }
            } catch (\Throwable $e) {
                $this->warn("  Open-Meteo also failed: {$e->getMessage()} — using baseline fallback");
                Log::warning("[RefreshAqi] Open-Meteo failed for {$slug}", ['error' => $e->getMessage()]);
            }

            // ---- Baseline Fallback ---------------------------------
            // If all APIs fail, keep existing data but log a warning
            if (!$record->exists) {
                $record->fill([
                    'location_name' => $meta['location_name'],
                    'latitude' => $meta['latitude'],
                    'longitude' => $meta['longitude'],
                    'aqi' => 42,
                    'status' => 'Good',
                    'pm10' => 28.0,
                    'pm2_5' => 14.0,
                    'source' => 'Baseline (API Unavailable)',
                    'last_updated_at' => now(),
                ]);
                $record->save();
                $this->warn("  Using baseline fallback for {$slug}");
            } else {
                $this->warn("  Keeping existing cached value for {$slug} (all APIs failed)");
            }
        }

        $this->info('AQI refresh complete.');
        return self::SUCCESS;
    }
}
