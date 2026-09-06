<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LocationAqi;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AqiController extends Controller
{
    /**
     * Return AQI for Islamabad from the database cache.
     *
     * Priority:
     *  1. Manual Admin Override (immediate, bypasses everything)
     *  2. DB-cached record (populated hourly by app:refresh-aqi)
     *  3. Hardcoded baseline (first-boot / total failure safety net)
     *
     * NO live API calls happen here — all fetching is handled by the
     * scheduled RefreshAqiCommand (app:refresh-aqi). This keeps costs
     * near-zero and response times fast.
     */
    public function getIslamabadAqi(): JsonResponse
    {
        // 1. Manual Admin Override (set via Admin Panel sensor override)
        if (Cache::has('manual_aqi_override')) {
            $override = Cache::get('manual_aqi_override');
            $override['source'] = 'Admin Override';
            return $this->successResponse($override, 'Air Quality Index retrieved successfully (Admin Override)');
        }

        // 2. DB-cached record from scheduled background refresh
        $record = LocationAqi::getForLocation('islamabad');

        if ($record) {
            return $this->successResponse(
                $record->toAqiPayload(),
                'Air Quality Index retrieved successfully'
            );
        }

        // 3. Absolute baseline — only hits if the DB table is empty (fresh install)
        return $this->successResponse([
            'location'       => 'Islamabad, Pakistan',
            'aqi'            => 42,
            'status'         => 'Good',
            'pm10'           => 28.0,
            'pm2_5'          => 14.0,
            'source'         => 'Baseline (Initialising)',
            'last_updated_at' => null,
        ], 'Air Quality Index retrieved successfully (Baseline)');
    }
}
