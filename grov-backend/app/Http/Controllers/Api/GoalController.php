<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\CommunityGoal;
use App\Models\MonitoringRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class GoalController extends Controller
{
    #[OA\Get(
        path: "/goals/monthly",
        summary: "Get monthly community goal progress",
        description: "Returns completion statistics for current month community goals.",
        tags: ["Monthly Community Goals"],
        responses: [
            new OA\Response(response: 200, description: "Monthly goal retrieved successfully")
        ]
    )]
    public function monthlyGoal(): JsonResponse
    {
        $currentMonth = (int) now()->format('m');
        $currentYear = (int) now()->format('Y');

        $goal = CommunityGoal::where('year', $currentYear)
            ->where('month', $currentMonth)
            ->first();

        if (!$goal) {
            $goal = CommunityGoal::firstOrCreate([
                'year' => $currentYear,
                'month' => $currentMonth,
            ], [
                'title' => 'Community Planting Goal',
                'target_trees' => 100000,
                'target_seeds' => 50000,
                'target_monitoring' => 200,
                'target_participants' => 200,
                'status' => 'active',
            ]);
        }

        // Aggregate current progress from source data
        $treesPlanted = Activity::where('activity_type', 'plantation')
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $seedsDispersed = Activity::where('activity_type', 'seeding')
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->with('seeding')
            ->get()
            ->sum(fn ($act) => $act->seeding->seeds_dispersed ?? 0);

        $monitoringCount = MonitoringRecord::whereYear('observation_date', $currentYear)
            ->whereMonth('observation_date', $currentMonth)
            ->count();

        $activeUsersCount = User::has('activities')->count();

        $totalPlanted = $treesPlanted; // Primary tree target comparison
        $percentage = round(($totalPlanted / max($goal->target_trees, 1)) * 100, 1);

        return $this->successResponse([
            'id' => $goal->id,
            'title' => $goal->title,
            'period' => now()->format('F Y'),
            'completion_percentage' => min($percentage, 100.0),
            'trees_planted' => $treesPlanted,
            'target_trees' => $goal->target_trees,
            'target_seeds' => $goal->target_seeds,
            'target_monitoring' => $goal->target_monitoring,
            'target_participants' => $goal->target_participants,
            'sub_goals' => [
                [
                    'name' => 'Trees Planted',
                    'current' => $treesPlanted,
                    'target' => $goal->target_trees,
                    'percentage' => round(($treesPlanted / max($goal->target_trees, 1)) * 100, 1),
                ],
                [
                    'name' => 'Seeds Dispersed',
                    'current' => $seedsDispersed,
                    'target' => $goal->target_seeds,
                    'percentage' => round(($seedsDispersed / max($goal->target_seeds, 1)) * 100, 1),
                ],
                [
                    'name' => 'Monitoring Records',
                    'current' => $monitoringCount,
                    'target' => $goal->target_monitoring,
                    'percentage' => round(($monitoringCount / max($goal->target_monitoring, 1)) * 100, 1),
                ],
                [
                    'name' => 'Active Participants',
                    'current' => $activeUsersCount,
                    'target' => $goal->target_participants,
                    'percentage' => round(($activeUsersCount / max($goal->target_participants, 1)) * 100, 1),
                ],
            ],
        ], 'Monthly goal retrieved successfully');
    }

    /**
     * Update monthly community goal targets (Admin only)
     */
    public function updateMonthlyGoal(Request $request): JsonResponse
    {
        $request->validate([
            'target_trees' => 'required|integer|min:100',
            'target_seeds' => 'nullable|integer|min:100',
            'target_monitoring' => 'nullable|integer|min:10',
            'target_participants' => 'nullable|integer|min:10',
        ]);

        $currentMonth = (int) now()->format('m');
        $currentYear = (int) now()->format('Y');

        $goal = CommunityGoal::firstOrCreate([
            'year' => $currentYear,
            'month' => $currentMonth,
        ], [
            'title' => 'Community Planting Goal',
            'target_trees' => 100000,
            'target_seeds' => 50000,
            'target_monitoring' => 200,
            'target_participants' => 200,
            'status' => 'active',
        ]);

        $goal->update([
            'target_trees' => $request->target_trees,
            'target_seeds' => $request->target_seeds ?? $goal->target_seeds,
            'target_monitoring' => $request->target_monitoring ?? $goal->target_monitoring,
            'target_participants' => $request->target_participants ?? $goal->target_participants,
        ]);

        return $this->successResponse($goal, 'Monthly community goal updated successfully by Admin');
    }
}
