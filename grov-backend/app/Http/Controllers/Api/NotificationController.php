<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    #[OA\Get(
        path: "/notifications",
        summary: "Get time-grouped notifications timeline",
        tags: ["Notifications System"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Notifications retrieved successfully")
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = $user->notifications()->latest()->get();

        $today = [];
        $yesterday = [];
        $thisWeek = [];

        foreach ($notifications as $notif) {
            if ($notif->created_at->isToday()) {
                $today[] = $notif;
            } elseif ($notif->created_at->isYesterday()) {
                $yesterday[] = $notif;
            } else {
                $thisWeek[] = $notif;
            }
        }

        return $this->successResponse([
            'unread_count' => $notifications->where('is_read', false)->count(),
            'timeline' => [
                'today' => $today,
                'yesterday' => $yesterday,
                'this_week' => $thisWeek,
            ],
        ], 'Notifications retrieved successfully');
    }

    #[OA\Patch(
        path: "/notifications/{id}/read",
        summary: "Mark a single notification as read",
        tags: ["Notifications System"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Notification marked as read")
        ]
    )]
    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);

        if (!$notification) {
            return $this->errorResponse('Notification not found', 404);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this->successResponse($notification, 'Notification marked as read');
    }

    #[OA\Patch(
        path: "/notifications/mark-all-read",
        summary: "Mark all notifications as read",
        tags: ["Notifications System"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "All notifications marked as read")
        ]
    )]
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this->successResponse(null, 'All notifications marked as read');
    }
}
