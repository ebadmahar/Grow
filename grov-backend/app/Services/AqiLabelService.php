<?php

namespace App\Services;

/**
 * Converts a numeric AQI value into the 6-tier label system
 * used throughout the Grōv platform.
 *
 * Tiers: Good | Fair | Moderate | Poor | Very Poor | Extremely Poor
 *
 * Based on the WHO / Open-Meteo EAQI scale.
 */
class AqiLabelService
{
    /**
     * @return array{ label: string, color: string, emoji: string }
     */
    public static function classify(int $aqi): array
    {
        return match (true) {
            $aqi <= 20  => ['label' => 'Good',           'color' => '#22C55E', 'emoji' => '✅'],
            $aqi <= 40  => ['label' => 'Fair',           'color' => '#84CC16', 'emoji' => '🟢'],
            $aqi <= 60  => ['label' => 'Moderate',       'color' => '#EAB308', 'emoji' => '🟡'],
            $aqi <= 80  => ['label' => 'Poor',           'color' => '#F97316', 'emoji' => '🟠'],
            $aqi <= 100 => ['label' => 'Very Poor',      'color' => '#EF4444', 'emoji' => '🔴'],
            default     => ['label' => 'Extremely Poor', 'color' => '#7C3AED', 'emoji' => '🟣'],
        };
    }

    public static function label(int $aqi): string
    {
        return static::classify($aqi)['label'];
    }
}
