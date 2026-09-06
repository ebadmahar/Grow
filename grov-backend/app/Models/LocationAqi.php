<?php

namespace App\Models;

use App\Services\AqiLabelService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LocationAqi extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_slug',
        'location_name',
        'latitude',
        'longitude',
        'aqi',
        'status',
        'pm10',
        'pm2_5',
        'source',
        'refresh_interval_hours',
        'last_updated_at',
        'raw_json',
    ];

    protected function casts(): array
    {
        return [
            'raw_json' => 'array',
            'last_updated_at' => 'datetime',
            'aqi' => 'integer',
            'pm10' => 'float',
            'pm2_5' => 'float',
            'refresh_interval_hours' => 'integer',
        ];
    }

    /**
     * The list of all currently supported locations with their metadata.
     * Add new cities here when expanding coverage.
     */
    public static function supportedLocations(): array
    {
        return [
            'islamabad' => [
                'location_name' => 'Islamabad, Pakistan',
                'latitude' => 33.7294,
                'longitude' => 73.0931,
            ],
            // 'lahore' => ['location_name' => 'Lahore, Pakistan', 'latitude' => 31.5204, 'longitude' => 74.3587],
            // 'karachi' => ['location_name' => 'Karachi, Pakistan', 'latitude' => 24.8607, 'longitude' => 67.0011],
        ];
    }

    /**
     * Return a cached AQI record for a slug, or null if none exists yet.
     */
    public static function getForLocation(string $slug): ?self
    {
        return static::where('location_slug', $slug)->first();
    }

    /**
     * Returns a generic fallback payload if DB record is not yet available.
     */
    public function toAqiPayload(): array
    {
        $aqi = $this->aqi ?? 42;
        $tier = AqiLabelService::classify($aqi);
        return [
            'location'        => $this->location_name,
            'aqi'             => $aqi,
            'status'          => $tier['label'],
            'aqi_color'       => $tier['color'],
            'aqi_emoji'       => $tier['emoji'],
            'pm10'            => $this->pm10 ?? 28.0,
            'pm2_5'           => $this->pm2_5 ?? 14.0,
            'source'          => $this->source ?? 'Cached',
            'last_updated_at' => $this->last_updated_at?->toISOString(),
        ];
    }
}
