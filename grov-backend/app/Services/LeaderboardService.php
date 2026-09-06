<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Support\Collection;

class LeaderboardService
{
    /**
     * Get leaderboard restorer rankings based on filter tab and time period.
     * Supported periods: 'all_time', 'weekly', 'last_week', 'monthly'
     */
    public function getLeaderboard(string $tab = 'plantation', string $period = 'all_time'): Collection
    {
        $currentYear = (int) now()->format('Y');
        $currentMonth = (int) now()->format('m');
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        $startOfLastWeek = now()->subWeek()->startOfWeek();
        $endOfLastWeek = now()->subWeek()->endOfWeek();

        return User::query()
            ->with(['activities.plantation', 'activities.seeding', 'pointsLedger'])
            ->get()
            ->map(function ($user) use ($tab, $period, $currentYear, $currentMonth, $startOfWeek, $endOfWeek, $startOfLastWeek, $endOfLastWeek) {
                $activitiesQuery = $user->activities()->where('status', 'verified');

                if ($period === 'weekly') {
                    $activitiesQuery->whereBetween('date', [$startOfWeek, $endOfWeek]);
                } elseif ($period === 'last_week') {
                    $activitiesQuery->whereBetween('date', [$startOfLastWeek, $endOfLastWeek]);
                } elseif ($period === 'monthly') {
                    $activitiesQuery->whereYear('date', $currentYear)->whereMonth('date', $currentMonth);
                }

                $activities = $activitiesQuery->get();

                $plantationCount = $activities->where('activity_type', 'plantation')
                    ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

                $seedingCount = $activities->where('activity_type', 'seeding')
                    ->sum(fn ($act) => $act->seeding->seeds_dispersed ?? 0);

                $pointsQuery = $user->pointsLedger();
                if ($period === 'weekly') {
                    $pointsQuery->whereBetween('created_at', [$startOfWeek, $endOfWeek]);
                } elseif ($period === 'last_week') {
                    $pointsQuery->whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek]);
                } elseif ($period === 'monthly') {
                    $pointsQuery->whereYear('created_at', $currentYear)->whereMonth('created_at', $currentMonth);
                }
                $points = $pointsQuery->sum('points');

                $score = match ($tab) {
                    'seeding' => $seedingCount,
                    'community' => $user->joinedTasks()->count() * 100,
                    default => $plantationCount, // plantation
                };

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role === 'admin' ? 'Admin Lead' : ($user->role === 'coordinator' ? 'Senior Field Restoration Lead' : 'Field Volunteer'),
                    'avatar_path' => $user->avatar_path,
                    'trees_planted' => $plantationCount,
                    'seeds_dispersed' => $seedingCount,
                    'activities_count' => $activities->count(),
                    'points' => $points,
                    'score' => $score,
                ];
            })
            ->sortByDesc('score')
            ->values()
            ->map(function ($item, $index) {
                $item['rank'] = $index + 1;
                return $item;
            });
    }

    /**
     * Get detailed ranking metrics for a specific user.
     */
    public function getUserRanking(User $user): array
    {
        $currentYear = (int) now()->format('Y');
        $currentMonth = (int) now()->format('m');

        $leaderboard = $this->getLeaderboard('plantation', 'all_time');
        $userRank = $leaderboard->firstWhere('id', $user->id)['rank'] ?? 1;

        $totalPlanted = Activity::where('user_id', $user->id)
            ->where('status', 'verified')
            ->where('activity_type', 'plantation')
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $totalSeeds = Activity::where('user_id', $user->id)
            ->where('status', 'verified')
            ->where('activity_type', 'seeding')
            ->with('seeding')
            ->get()
            ->sum(fn ($act) => $act->seeding->seeds_dispersed ?? 0);

        $monitoringCount = $user->monitoringRecords()->count();
        $totalActivities = $user->activities()->where('status', '!=', 'rejected')->count();
        $verifiedCount = $user->activities()->where('status', 'verified')->count();

        return [
            'rank' => "#{$userRank}",
            'user' => [
                'name' => $user->name,
                'role' => $user->role === 'admin' ? 'Admin Lead' : ($user->role === 'coordinator' ? 'Field Coordinator' : 'Volunteer'),
                'avatar_path' => $user->avatar_path,
            ],
            'monthly_points' => (int) $user->pointsLedger()->sum('points'),
            'metrics' => [
                'trees_planted' => $totalPlanted,
                'seeds_dispersed' => $totalSeeds,
                'monitoring_records' => $monitoringCount,
                'total_activities' => $totalActivities,
                'verified_activities' => $totalActivities > 0 ? round(($verifiedCount / $totalActivities) * 100) . '%' : '100%',
            ],
            'status_message' => 'Keep planting native species to climb the regional restorer leaderboard!',
        ];
    }
}
