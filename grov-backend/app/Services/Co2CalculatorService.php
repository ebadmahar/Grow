<?php

namespace App\Services;

/**
 * Calculates CO2 offset according to official platform formula:
 * Weekly CO₂ = (Trees × Annual CO₂ per Tree × Survival Rate × Growth Factor) / 52
 *
 * Parameters:
 * - Annual CO₂ per Tree: 21.77 kg/year (standard mature tree baseline)
 * - Survival Rate: 0.85 (85%)
 * - Growth Factor: 1.2
 */
class Co2CalculatorService
{
    public const ANNUAL_CO2_PER_TREE = 21.77;
    public const SURVIVAL_RATE = 0.85;
    public const GROWTH_FACTOR = 1.2;

    /**
     * Calculate weekly CO2 offset in kg
     */
    public static function calculateWeeklyOffset(int $treeCount): float
    {
        if ($treeCount <= 0) return 0.0;
        return round(($treeCount * self::ANNUAL_CO2_PER_TREE * self::SURVIVAL_RATE * self::GROWTH_FACTOR) / 52, 2);
    }

    /**
     * Calculate annual / total all-time CO2 offset in kg
     */
    public static function calculateTotalOffset(int $treeCount): float
    {
        if ($treeCount <= 0) return 0.0;
        return round($treeCount * self::ANNUAL_CO2_PER_TREE * self::SURVIVAL_RATE * self::GROWTH_FACTOR, 2);
    }
}
