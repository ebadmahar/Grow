<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\UserPoint;

class PointsCalculatorService
{
    /**
     * Calculate and award points for a plantation activity.
     */
    public function calculateAndAwardPlantation(Activity $activity, int $quantityPlanted, int $photoCount = 0): int
    {
        // Business rule: 10 points per tree planted + 50 points per photo evidence (max 250 bonus)
        $basePoints = $quantityPlanted * 10;
        $evidenceBonus = min($photoCount, 5) * 50;
        $totalPoints = $basePoints + $evidenceBonus;

        $activity->update(['points_awarded' => $totalPoints]);

        UserPoint::create([
            'user_id' => $activity->user_id,
            'activity_id' => $activity->id,
            'points' => $totalPoints,
            'reason' => "Tree Plantation Activity ({$quantityPlanted} saplings logged)",
        ]);

        return $totalPoints;
    }

    /**
     * Calculate and award points for a seeding activity.
     */
    public function calculateAndAwardSeeding(Activity $activity, int $seedsDispersed, int $photoCount = 0): int
    {
        // Business rule: 1 point per seed dispersed + 50 points per photo evidence (max 250 bonus)
        $basePoints = $seedsDispersed * 1;
        $evidenceBonus = min($photoCount, 5) * 50;
        $totalPoints = $basePoints + $evidenceBonus;

        $activity->update(['points_awarded' => $totalPoints]);

        UserPoint::create([
            'user_id' => $activity->user_id,
            'activity_id' => $activity->id,
            'points' => $totalPoints,
            'reason' => "Seed Bombing Activity ({$seedsDispersed} seeds dispersed)",
        ]);

        return $totalPoints;
    }
}
