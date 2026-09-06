<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Location;
use App\Services\Co2CalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class MapController extends Controller
{
    #[OA\Get(
        path: "/activities/map",
        summary: "Get live restoration map site pins",
        description: "Returns activity site markers with coordinates, status, and activity counts. Excludes rejected activities.",
        tags: ["Explore Map & Locations"],
        parameters: [
            new OA\Parameter(name: "plantation", in: "query", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "seeding", in: "query", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "monitored", in: "query", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "verified", in: "query", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "bbox", in: "query", description: "Bounding box min_lat,min_lng,max_lat,max_lng", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Map site pins retrieved successfully")
        ]
    )]
    public function mapPins(Request $request): JsonResponse
    {
        $query = Activity::with(['location', 'plantation.species', 'seeding.species', 'user'])
            ->where('status', '!=', 'rejected');

        if ($request->has('verified') && filter_var($request->verified, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('status', 'verified');
        }

        if ($request->has('plantation') && filter_var($request->plantation, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('activity_type', 'plantation');
        }

        if ($request->has('seeding') && filter_var($request->seeding, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('activity_type', 'seeding');
        }

        if ($request->has('monitored') && filter_var($request->monitored, FILTER_VALIDATE_BOOLEAN)) {
            $query->has('monitoringRecords');
        }

        if ($request->filled('bbox')) {
            $parts = explode(',', $request->bbox);
            if (count($parts) === 4) {
                [$minLat, $minLng, $maxLat, $maxLng] = array_map('floatval', $parts);
                $query->whereHas('location', function ($q) use ($minLat, $minLng, $maxLat, $maxLng) {
                    $q->whereBetween('latitude', [$minLat, $maxLat])
                      ->whereBetween('longitude', [$minLng, $maxLng]);
                });
            }
        }

        $activities = $query->latest()->get();

        $pins = $activities->map(function ($act) {
            $count = $act->activity_type === 'plantation'
                ? ($act->plantation->quantity_planted ?? 0)
                : ($act->seeding->seeds_dispersed ?? 0);

            $speciesName = $act->activity_type === 'plantation'
                ? ($act->plantation->species->common_name ?? 'Tree')
                : ($act->seeding->species->common_name ?? 'Seed');

            return [
                'id' => $act->id,
                'title' => $act->location->name ?? 'Restoration Site',
                'activity_type' => $act->activity_type,
                'status' => $act->status,
                'count' => $count,
                'species' => $speciesName,
                'latitude' => $act->location->latitude ?? 33.7294,
                'longitude' => $act->location->longitude ?? 73.0931,
                'date' => $act->date->format('Y-m-d'),
                'user_id' => $act->user_id,
                'user_name' => $act->user->name ?? 'Restorer',
            ];
        });

        return $this->successResponse($pins, 'Map pins retrieved successfully');
    }

    #[OA\Get(
        path: "/locations/explore",
        summary: "Get summary statistics for Explore Map floating bar & Home page",
        tags: ["Explore Map & Locations"],
        responses: [
            new OA\Response(response: 200, description: "Map summary stats retrieved successfully")
        ]
    )]
    public function exploreStats(): JsonResponse
    {
        $verifiedActivities = Activity::where('status', 'verified');

        $totalPlanted = (clone $verifiedActivities)
            ->where('activity_type', 'plantation')
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $totalSeeded = (clone $verifiedActivities)
            ->where('activity_type', 'seeding')
            ->with('seeding')
            ->get()
            ->sum(fn ($act) => $act->seeding->seeds_dispersed ?? 0);

        // Daily count: recorded today across Islamabad
        $dailyPlantations = Activity::where('status', 'verified')
            ->where('activity_type', 'plantation')
            ->whereDate('date', today())
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $dailySeeding = Activity::where('status', 'verified')
            ->where('activity_type', 'seeding')
            ->whereDate('date', today())
            ->with('seeding')
            ->get()
            ->sum(fn ($act) => $act->seeding->seeds_dispersed ?? 0);

        $dailyRecorded = $dailyPlantations + $dailySeeding;

        $activeSitesCount = Location::whereHas('activities', function ($q) {
            $q->where('status', 'verified');
        })->count();

        // Calculate CO2 offset using formula: (Trees × Annual CO₂ per Tree × Survival Rate × Growth Factor) / 52
        $co2WeeklyKg = Co2CalculatorService::calculateWeeklyOffset($totalPlanted);
        $co2TotalKg = Co2CalculatorService::calculateTotalOffset($totalPlanted);

        return $this->successResponse([
            'total_planted' => $totalPlanted,
            'total_seeded' => $totalSeeded,
            'daily_recorded' => $dailyRecorded,
            'active_sites' => $activeSitesCount,
            'co2_weekly_kg' => $co2WeeklyKg,
            'co2_offset_kg' => $co2WeeklyKg,
            'regional_survival_rate' => '85.0%',
        ], 'Explore map summary retrieved successfully');
    }
}
