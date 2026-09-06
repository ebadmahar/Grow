<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled AQI Refresh
|--------------------------------------------------------------------------
| Fetches fresh AQI data from Google Air Quality API (with Open-Meteo
| as a free fallback) and caches it in the location_aqis table.
| Change ->hourly() to ->everyNHours(6) if you want less frequent refreshes.
*/
Schedule::command('app:refresh-aqi')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('[Scheduler] app:refresh-aqi failed');
    });

