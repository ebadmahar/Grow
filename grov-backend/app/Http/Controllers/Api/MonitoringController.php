<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\StoreMonitoringRecordRequest;
use App\Models\Activity;
use App\Models\ActivityPhoto;
use App\Models\MonitoringRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class MonitoringController extends Controller
{
    #[OA\Get(
        path: "/monitoring/records",
        summary: "List monitoring history records",
        tags: ["Monitoring System"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Monitoring records retrieved successfully")
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $records = MonitoringRecord::with(['activity.location', 'activity.plantation.species', 'activity.seeding.species', 'user', 'photos'])
            ->whereHas('activity', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->latest('observation_date')
            ->get();

        return $this->successResponse($records, 'Monitoring records retrieved successfully');
    }

    #[OA\Get(
        path: "/activities/{activity_id}/monitoring",
        summary: "List monitoring observations for specific activity",
        tags: ["Monitoring System"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "activity_id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Activity monitoring records retrieved successfully"),
            new OA\Response(response: 404, description: "Activity not found")
        ]
    )]
    public function forActivity(int $activityId): JsonResponse
    {
        $activity = Activity::find($activityId);

        if (!$activity) {
            return $this->errorResponse('Activity not found', 404);
        }

        $records = $activity->monitoringRecords()
            ->with(['user', 'photos'])
            ->latest('observation_date')
            ->get();

        return $this->successResponse([
            'activity_id' => $activityId,
            'monitoring_records' => $records,
        ], 'Activity monitoring records retrieved successfully');
    }

    #[OA\Post(
        path: "/monitoring/records",
        summary: "Submit a monitoring record",
        description: "Records observation count, survival status, notes, and photos for a past activity.",
        tags: ["Monitoring System"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["activity_id", "observation_date", "observed_count", "established_count", "surviving_count", "dead_count", "condition"],
                    properties: [
                        new OA\Property(property: "activity_id", type: "integer", example: 1),
                        new OA\Property(property: "observation_date", type: "string", format: "date", example: "2026-08-27"),
                        new OA\Property(property: "observed_count", type: "integer", example: 96),
                        new OA\Property(property: "established_count", type: "integer", example: 82),
                        new OA\Property(property: "surviving_count", type: "integer", example: 78),
                        new OA\Property(property: "dead_count", type: "integer", example: 4),
                        new OA\Property(property: "condition", type: "string", enum: ["Good", "Fair", "Poor", "Unknown"]),
                        new OA\Property(property: "notes", type: "string"),
                        new OA\Property(property: "photos[]", type: "array", items: new OA\Items(type: "string", format: "binary"))
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Monitoring record submitted successfully"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function store(StoreMonitoringRecordRequest $request): JsonResponse
    {
        $user = $request->user();
        $activity = Activity::find($request->activity_id);

        if (!$activity) {
            return $this->errorResponse('Activity not found', 404);
        }

        if ($activity->status === 'rejected') {
            return $this->errorResponse('Monitoring observation cannot be added for a rejected activity.', 422);
        }

        $record = DB::transaction(function () use ($request, $user, $activity) {
            $record = MonitoringRecord::create([
                'activity_id' => $activity->id,
                'user_id' => $user->id,
                'observation_date' => $request->observation_date,
                'observed_count' => $request->observed_count,
                'established_count' => $request->established_count,
                'surviving_count' => $request->surviving_count,
                'dead_count' => $request->dead_count,
                'condition' => $request->condition,
                'notes' => $request->notes,
            ]);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $path = $file->store('evidence', 'public');
                    ActivityPhoto::create([
                        'activity_id' => $activity->id,
                        'monitoring_record_id' => $record->id,
                        'file_path' => asset('storage/' . $path),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                    ]);
                }
            }

            return $record;
        });

        return $this->successResponse(
            $record->load(['activity.location', 'photos']),
            'Monitoring record submitted successfully',
            201
        );
    }
}
