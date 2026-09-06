<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityTaskRequest;
use App\Models\CommunityTask;
use App\Models\CommunityTaskParticipant;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class CommunityTaskController extends Controller
{
    #[OA\Get(
        path: "/community/tasks",
        summary: "List active community tasks",
        tags: ["Community Hub & Tasks"],
        responses: [
            new OA\Response(response: 200, description: "Community tasks retrieved successfully")
        ]
    )]
    public function index(): JsonResponse
    {
        $tasks = CommunityTask::with(['creator', 'location', 'activeParticipants'])
            ->where('status', 'open')
            ->latest('date')
            ->get()
            ->map(function ($task) {
                $task->participants_count = $task->activeParticipants->count();
                return $task;
            });

        return $this->successResponse($tasks, 'Community tasks retrieved successfully');
    }

    #[OA\Get(
        path: "/community/tasks/{id}",
        summary: "Get community task details and participants",
        tags: ["Community Hub & Tasks"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Task details retrieved successfully"),
            new OA\Response(response: 404, description: "Task not found")
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $task = CommunityTask::with(['creator', 'location', 'activeParticipants'])->find($id);

        if (!$task) {
            return $this->errorResponse('Community task not found', 404);
        }

        $task->participants_count = $task->activeParticipants->count();

        return $this->successResponse($task, 'Community task details retrieved successfully');
    }

    #[OA\Post(
        path: "/community/tasks",
        summary: "Create a new community task",
        tags: ["Community Hub & Tasks"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["title", "activity_type", "site_name", "latitude", "longitude", "date", "start_time", "description"],
                    properties: [
                        new OA\Property(property: "title", type: "string", example: "Margalla Trail Plantation"),
                        new OA\Property(property: "activity_type", type: "string", enum: ["Tree Plantation", "Seed Bombing", "Monitoring Visit", "Site Survey", "Mixed Activities"]),
                        new OA\Property(property: "site_name", type: "string", example: "Margalla Trail 3 Entrance"),
                        new OA\Property(property: "latitude", type: "number", example: 33.7381),
                        new OA\Property(property: "longitude", type: "number", example: 73.0650),
                        new OA\Property(property: "date", type: "string", format: "date", example: "2026-08-30"),
                        new OA\Property(property: "start_time", type: "string", example: "07:00:00"),
                        new OA\Property(property: "max_volunteers", type: "integer", example: 30),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "cover_image", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Community task created successfully")
        ]
    )]
    public function store(StoreCommunityTaskRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'coordinator' && $user->role !== 'admin') {
            return $this->errorResponse('Only Field Coordinators and Admins can create community restoration drives.', 403);
        }

        $task = DB::transaction(function () use ($request, $user) {
            $location = Location::create([
                'name' => $request->site_name,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'region' => 'Islamabad, Pakistan',
            ]);

            $coverPath = null;
            if ($request->hasFile('cover_image')) {
                $path = $request->file('cover_image')->store('tasks', 'public');
                $coverPath = asset('storage/' . $path);
            }

            $task = CommunityTask::create([
                'creator_id' => $user->id,
                'location_id' => $location->id,
                'title' => $request->title,
                'activity_type' => $request->activity_type,
                'date' => $request->date,
                'start_time' => $request->start_time,
                'max_volunteers' => $request->max_volunteers,
                'description' => $request->description,
                'cover_image_path' => $coverPath,
                'status' => 'open',
            ]);

            // Add creator as host/organizer
            CommunityTaskParticipant::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'role' => 'organizer',
                'status' => 'joined',
            ]);

            return $task;
        });

        return $this->successResponse(
            $task->load(['creator', 'location', 'activeParticipants']),
            'Community task created successfully',
            201
        );
    }

    #[OA\Post(
        path: "/community/tasks/{id}/join",
        summary: "Join a community task",
        description: "Enforces max volunteers capacity check inside an atomic database transaction.",
        tags: ["Community Hub & Tasks"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Joined task successfully"),
            new OA\Response(response: 400, description: "Task is full or already joined")
        ]
    )]
    public function join(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($id, $user) {
            $task = CommunityTask::where('id', $id)->lockForUpdate()->first();

            if (!$task || $task->status !== 'open') {
                return $this->errorResponse('Community task is not open for registration', 400);
            }

            $currentCount = CommunityTaskParticipant::where('task_id', $id)
                ->where('status', 'joined')
                ->count();

            if ($task->max_volunteers && $currentCount >= $task->max_volunteers) {
                return $this->errorResponse('Task capacity reached. Cannot join full task.', 400);
            }

            $participant = CommunityTaskParticipant::where('task_id', $id)
                ->where('user_id', $user->id)
                ->first();

            if ($participant && $participant->status === 'joined') {
                return $this->errorResponse('You have already joined this task.', 400);
            }

            if ($participant) {
                $participant->update(['status' => 'joined']);
            } else {
                CommunityTaskParticipant::create([
                    'task_id' => $id,
                    'user_id' => $user->id,
                    'role' => 'participant',
                    'status' => 'joined',
                ]);
            }

            return $this->successResponse([
                'task_id' => $id,
                'status' => 'joined',
                'current_participants' => $currentCount + 1,
            ], 'Joined task successfully');
        });
    }

    #[OA\Post(
        path: "/community/tasks/{id}/leave",
        summary: "Leave a community task",
        tags: ["Community Hub & Tasks"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Left task successfully")
        ]
    )]
    public function leave(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $participant = CommunityTaskParticipant::where('task_id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'joined')
            ->first();

        if (!$participant) {
            return $this->errorResponse('You are not currently joined in this task.', 400);
        }

        $participant->update(['status' => 'cancelled']);

        return $this->successResponse([
            'task_id' => $id,
            'status' => 'cancelled',
        ], 'Left task successfully');
    }

    /**
     * Update a community restoration drive.
     * Admin can edit any drive; Coordinator can edit only their own drive.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = CommunityTask::find($id);

        if (!$task) {
            return $this->errorResponse('Community drive not found', 404);
        }

        if ($user->role !== 'admin' && ($user->role !== 'coordinator' || $task->creator_id !== $user->id)) {
            return $this->errorResponse('You do not have permission to edit this community drive.', 403);
        }

        $task->update($request->only([
            'title', 'activity_type', 'date', 'start_time', 'max_volunteers', 'description', 'status'
        ]));

        return $this->successResponse($task->load(['creator', 'location']), 'Community drive updated successfully');
    }

    /**
     * Delete a community restoration drive.
     * Admin can delete any drive; Coordinator can delete only their own drive.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $task = CommunityTask::find($id);

        if (!$task) {
            return $this->errorResponse('Community drive not found', 404);
        }

        if ($user->role !== 'admin' && ($user->role !== 'coordinator' || $task->creator_id !== $user->id)) {
            return $this->errorResponse('You do not have permission to delete this community drive.', 403);
        }

        $task->delete();
        return $this->successResponse(null, 'Community drive deleted successfully');
    }
}
