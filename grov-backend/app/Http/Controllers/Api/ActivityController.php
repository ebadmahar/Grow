<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Activity\StorePlantationActivityRequest;
use App\Http\Requests\Activity\StoreSeedingActivityRequest;
use App\Models\Activity;
use App\Models\ActivityPhoto;
use App\Models\Location;
use App\Models\Notification;
use App\Models\PlantationActivity;
use App\Models\SeedingActivity;
use App\Services\LocationValidationService;
use App\Services\PointsCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class ActivityController extends Controller
{
    public function __construct(
        protected PointsCalculatorService $pointsCalculator,
        protected LocationValidationService $locationValidator
    ) {}

    #[OA\Get(
        path: "/activities/my-activities",
        summary: "Get user's logged activities",
        description: "Returns list of current user's activities with filter options (all, plantation, seeding, monitored).",
        tags: ["Activities"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "filter", in: "query", schema: new OA\Schema(type: "string", enum: ["all", "plantation", "seeding", "monitored"]))
        ],
        responses: [
            new OA\Response(response: 200, description: "Activities retrieved successfully")
        ]
    )]
    public function myActivities(Request $request): JsonResponse
    {
        $query = $request->user()->activities()
            ->with(['location', 'plantation.species', 'seeding.species', 'monitoringRecords']);

        if ($request->has('filter')) {
            match ($request->filter) {
                'plantation' => $query->where('activity_type', 'plantation'),
                'seeding' => $query->where('activity_type', 'seeding'),
                'monitored' => $query->has('monitoringRecords'),
                default => null,
            };
        }

        $activities = $query->latest('date')->get();

        return $this->successResponse($activities, 'My activities retrieved successfully');
    }

    #[OA\Get(
        path: "/activities/{id}",
        summary: "Get single activity details",
        description: "Returns full activity information, stepper timeline, photos, and monitoring history.",
        tags: ["Activities"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Activity details retrieved successfully"),
            new OA\Response(response: 404, description: "Activity not found")
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $activity = Activity::with([
            'user',
            'location',
            'plantation.species',
            'seeding.species',
            'photos',
            'monitoringRecords.user',
            'verifier',
        ])->find($id);

        if (!$activity) {
            return $this->errorResponse('Activity not found', 404);
        }

        return $this->successResponse($activity, 'Activity details retrieved successfully');
    }

    #[OA\Post(
        path: "/activities/plantation",
        summary: "Log a tree plantation activity",
        description: "Logs sapling planting, creates location, stores photo evidence, awards server-side points.",
        tags: ["Activities"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["species_id", "quantity_planted", "date", "site_name", "latitude", "longitude", "planting_method"],
                    properties: [
                        new OA\Property(property: "species_id", type: "integer", example: 1),
                        new OA\Property(property: "quantity_planted", type: "integer", example: 120),
                        new OA\Property(property: "date", type: "string", format: "date", example: "2026-08-27"),
                        new OA\Property(property: "site_name", type: "string", example: "Margalla Hills Sector 3"),
                        new OA\Property(property: "latitude", type: "number", format: "float", example: 33.7294),
                        new OA\Property(property: "longitude", type: "number", format: "float", example: 73.0931),
                        new OA\Property(property: "planting_method", type: "string", enum: ["Pit Planting", "Trench Planting", "Mound Planting", "Aerial Planting"]),
                        new OA\Property(property: "field_notes", type: "string"),
                        new OA\Property(property: "photos[]", type: "array", items: new OA\Items(type: "string", format: "binary"))
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Plantation activity logged successfully")
        ]
    )]
    public function storePlantation(StorePlantationActivityRequest $request): JsonResponse
    {
        $user = $request->user();

        // Validate that the location is within a supported region (currently Islamabad only)
        $locationCheck = $this->locationValidator->validate(
            (float) $request->latitude,
            (float) $request->longitude
        );
        if (!$locationCheck['valid']) {
            return $this->errorResponse($locationCheck['message'], 422);
        }

        $activity = DB::transaction(function () use ($request, $user) {
            $location = Location::create([
                'name' => $request->site_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'region' => 'Islamabad, Pakistan',
            ]);

            $activity = Activity::create([
                'user_id' => $user->id,
                'location_id' => $location->id,
                'activity_type' => 'plantation',
                'status' => 'reported',
                'date' => $request->date,
                'field_notes' => $request->field_notes,
            ]);

            PlantationActivity::create([
                'activity_id' => $activity->id,
                'species_id' => $request->species_id,
                'quantity_planted' => $request->quantity_planted,
                'planting_method' => $request->planting_method,
            ]);

            $photoCount = 0;
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $path = $file->store('evidence', 'public');
                    ActivityPhoto::create([
                        'activity_id' => $activity->id,
                        'file_path' => asset('storage/' . $path),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                    ]);
                    $photoCount++;
                }
            }

            // Points will be calculated and awarded upon verification by Coordinator/Admin
            return $activity;
        });

        // Check 500-tree milestone — notify all admins so they can promote to Coordinator
        $totalPlanted = PlantationActivity::whereHas('activity', fn ($q) => $q->where('user_id', $user->id))
            ->sum('quantity_planted');

        if ($totalPlanted >= 500 && $totalPlanted - $request->quantity_planted < 500) {
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type'    => 'system',
                    'title'   => '🌳 Milestone: 500 Trees Planted!',
                    'message' => "{$user->name} just crossed the 500-tree milestone ({$totalPlanted} total). Consider promoting them to Field Coordinator.",
                    'data_json' => ['user_id' => $user->id, 'total_planted' => $totalPlanted],
                ]);
            }
        }

        return $this->successResponse(
            $activity->load(['location', 'plantation.species', 'photos']),
            'Plantation activity logged successfully',
            201
        );
    }

    #[OA\Post(
        path: "/activities/seeding",
        summary: "Log a seed bombing activity",
        description: "Logs seed dispersal, creates location, stores photo evidence, awards server-side points.",
        tags: ["Activities"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["species_id", "seeds_dispersed", "date", "site_name", "latitude", "longitude", "dispersal_method"],
                    properties: [
                        new OA\Property(property: "species_id", type: "integer", example: 2),
                        new OA\Property(property: "seeds_dispersed", type: "integer", example: 500),
                        new OA\Property(property: "date", type: "string", format: "date", example: "2026-08-27"),
                        new OA\Property(property: "site_name", type: "string", example: "G-11 Margalla Trail"),
                        new OA\Property(property: "latitude", type: "number", format: "float", example: 33.7294),
                        new OA\Property(property: "longitude", type: "number", format: "float", example: 73.0931),
                        new OA\Property(property: "dispersal_method", type: "string", enum: ["Hand Broadcasting", "Seed Bombing (aerial)", "Seed Drill", "Hydroseeding"]),
                        new OA\Property(property: "coverage_area_sqm", type: "integer", example: 2000),
                        new OA\Property(property: "field_notes", type: "string"),
                        new OA\Property(property: "photos[]", type: "array", items: new OA\Items(type: "string", format: "binary"))
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Seeding activity logged successfully")
        ]
    )]
    public function storeSeeding(StoreSeedingActivityRequest $request): JsonResponse
    {
        $user = $request->user();

        // Validate that the location is within a supported region (currently Islamabad only)
        $locationCheck = $this->locationValidator->validate(
            (float) $request->latitude,
            (float) $request->longitude
        );
        if (!$locationCheck['valid']) {
            return $this->errorResponse($locationCheck['message'], 422);
        }

        $activity = DB::transaction(function () use ($request, $user) {
            $location = Location::create([
                'name' => $request->site_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'region' => 'Islamabad, Pakistan',
            ]);

            $activity = Activity::create([
                'user_id' => $user->id,
                'location_id' => $location->id,
                'activity_type' => 'seeding',
                'status' => 'reported',
                'date' => $request->date,
                'field_notes' => $request->field_notes,
            ]);

            SeedingActivity::create([
                'activity_id' => $activity->id,
                'species_id' => $request->species_id,
                'seeds_dispersed' => $request->seeds_dispersed,
                'dispersal_method' => $request->dispersal_method,
                'coverage_area_sqm' => $request->coverage_area_sqm,
            ]);

            $photoCount = 0;
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $path = $file->store('evidence', 'public');
                    ActivityPhoto::create([
                        'activity_id' => $activity->id,
                        'file_path' => asset('storage/' . $path),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                    ]);
                    $photoCount++;
                }
            }

            // Points will be calculated and awarded upon verification by Coordinator/Admin
            return $activity;
        });

        return $this->successResponse(
            $activity->load(['location', 'seeding.species', 'photos']),
            'Seeding activity logged successfully',
            201
        );
    }
}
