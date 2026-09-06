<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResolveReportRequest;
use App\Http\Requests\Admin\VerifyActivityRequest;
use App\Models\Activity;
use App\Models\Notification;
use App\Models\Report;
use App\Models\User;
use App\Services\PointsCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminController extends Controller
{
    public function __construct(
        protected PointsCalculatorService $pointsCalculator
    ) {}

    #[OA\Get(
        path: "/admin/dashboard",
        summary: "Get admin panel dashboard metrics",
        tags: ["Admin Panel"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Admin metrics retrieved successfully")
        ]
    )]
    public function dashboard(): JsonResponse
    {
        $totalUsers = User::count();
        $totalActivities = Activity::count();

        $totalPlanted = Activity::where('status', 'verified')
            ->where('activity_type', 'plantation')
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $pendingReviewCount = Activity::where('status', 'reported')->count();

        return $this->successResponse([
            'total_users' => $totalUsers,
            'total_activities' => $totalActivities,
            'trees_planted' => $totalPlanted,
            'pending_review' => $pendingReviewCount,
            'metrics_change' => [
                'users' => '+18 this week',
                'activities' => '+34 today',
                'trees_planted' => 'Month goal: 74.5%',
                'pending_review' => 'Needs attention',
            ],
        ], 'Admin dashboard statistics retrieved successfully');
    }

    #[OA\Get(
        path: "/admin/activities",
        summary: "List activity verification queue",
        tags: ["Admin Panel"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "status", in: "query", schema: new OA\Schema(type: "string", enum: ["reported", "verified", "rejected"]))
        ],
        responses: [
            new OA\Response(response: 200, description: "Activities queue retrieved successfully")
        ]
    )]
    public function activities(Request $request): JsonResponse
    {
        $query = Activity::with(['user', 'location', 'plantation.species', 'seeding.species', 'photos']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $activities = $query->latest()->get();

        return $this->successResponse($activities, 'Activity verification queue retrieved successfully');
    }

    #[OA\Patch(
        path: "/admin/activities/{id}/verify",
        summary: "Approve or reject an activity",
        tags: ["Admin Panel"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(property: "status", type: "string", enum: ["verified", "rejected"])
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Activity verification status updated successfully")
        ]
    )]
    public function verifyActivity(VerifyActivityRequest $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $activity = Activity::with(['plantation', 'seeding', 'photos'])->find($id);

        if (!$activity) {
            return $this->errorResponse('Activity not found', 404);
        }

        // Authorization check: User cannot approve their own activity unless they are an admin
        if ($activity->user_id === $admin->id && $admin->role !== 'admin') {
            return $this->errorResponse('Coordinators cannot self-verify their own activities.', 403);
        }

        $previousStatus = $activity->status;
        $activity->update([
            'status' => $request->status,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        // Upon approval/verification, calculate and award points to the creator
        if ($request->status === 'verified' && $previousStatus !== 'verified') {
            $photoCount = $activity->photos ? $activity->photos->count() : 0;
            if ($activity->activity_type === 'plantation' && $activity->plantation) {
                $this->pointsCalculator->calculateAndAwardPlantation(
                    $activity,
                    $activity->plantation->quantity_planted,
                    $photoCount
                );
            } elseif ($activity->activity_type === 'seeding' && $activity->seeding) {
                $this->pointsCalculator->calculateAndAwardSeeding(
                    $activity,
                    $activity->seeding->seeds_dispersed,
                    $photoCount
                );
            }

            Notification::create([
                'user_id' => $activity->user_id,
                'type' => 'verification',
                'title' => 'Activity Verified & Points Awarded',
                'message' => 'Your activity submission has been verified by field lead ' . $admin->name . '! Points have been credited.',
                'is_read' => false,
            ]);
        }

        return $this->successResponse($activity->load(['user', 'verifier']), 'Activity verification status updated successfully');
    }

    #[OA\Get(
        path: "/admin/reports",
        summary: "List environmental issue reports and bug/suggestion reports",
        tags: ["Admin Panel"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Reports retrieved successfully")
        ]
    )]
    public function reports(): JsonResponse
    {
        $reports = Report::with(['reporter', 'photos', 'resolver'])->latest()->get();

        return $this->successResponse($reports, 'Environmental & bug reports retrieved successfully');
    }

    #[OA\Patch(
        path: "/admin/reports/{id}/resolve",
        summary: "Update issue report resolution status",
        tags: ["Admin Panel"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(property: "status", type: "string", enum: ["investigating", "resolved", "dismissed"]),
                    new OA\Property(property: "resolution_notes", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Report status updated successfully")
        ]
    )]
    public function resolveReport(ResolveReportRequest $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $report = Report::find($id);

        if (!$report) {
            return $this->errorResponse('Report not found', 404);
        }

        $report->update([
            'status' => $request->status,
            'resolution_notes' => $request->resolution_notes,
            'resolved_by' => $admin->id,
            'resolved_at' => now(),
        ]);

        return $this->successResponse($report->load(['reporter', 'resolver']), 'Report status updated successfully');
    }

    /**
     * Broadcast notification to all users (Admin only)
     */
    public function broadcastNotification(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $users = User::all();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'system',
                'title' => $request->title,
                'message' => $request->message,
                'is_read' => false,
            ]);

            // Dispatch HTML email via noreply@growgrov.org
            \App\Services\MailService::sendNotificationEmail(
                $user->email,
                $request->title,
                $request->title,
                "<p>" . nl2br(e($request->message)) . "</p>"
            );
        }

        return $this->successResponse(null, 'Notification & HTML newsletter broadcasted to all community users successfully');
    }

    /**
     * Get Dual-SMTP configuration (Admin only)
     */
    public function getSmtpSettings(): JsonResponse
    {
        return $this->successResponse(\App\Services\MailService::getSmtpSettings(), 'Dual-SMTP settings retrieved successfully');
    }

    /**
     * Update Dual-SMTP configuration (Admin only)
     */
    public function updateSmtpSettings(Request $request): JsonResponse
    {
        $request->validate([
            'noreply' => 'sometimes|array',
            'security' => 'sometimes|array',
        ]);

        \App\Services\MailService::saveSmtpSettings($request->all());

        return $this->successResponse(\App\Services\MailService::getSmtpSettings(), 'Dual-SMTP configuration saved successfully');
    }

    /**
     * Send Test HTML Email via noreply@growgrov.org or security@growgrov.org (Admin only)
     */
    public function sendTestEmail(Request $request): JsonResponse
    {
        $request->validate([
            'mailer' => 'required|in:noreply,security',
            'recipient' => 'required|email',
        ]);

        $mailer = $request->mailer;
        $recipient = $request->recipient;

        if ($mailer === 'security') {
            $sent = \App\Services\MailService::sendSecurityEmail(
                $recipient,
                'Test Security Email from Grōv',
                'Grōv Security SMTP Verification',
                '<p>This is a test HTML security email sent via <b>security@growgrov.org</b> mailer transport.</p>'
            );
        } else {
            $sent = \App\Services\MailService::sendNotificationEmail(
                $recipient,
                'Test Notification Email from Grōv',
                'Grōv Notifications SMTP Verification',
                '<p>This is a test HTML newsletter email sent via <b>noreply@growgrov.org</b> mailer transport.</p>'
            );
        }

        if ($sent) {
            return $this->successResponse(null, "Test email dispatched successfully to {$recipient} via {$mailer}@growgrov.org.");
        } else {
            return $this->errorResponse("Failed to dispatch test email via {$mailer} mailer transport. Check server logs.", 500);
        }
    }

    /**
     * List all platform users (Admin only)
     */
    public function users(Request $request): JsonResponse
    {
        $users = User::withCount('activities')->latest()->get();
        return $this->successResponse($users, 'Users retrieved successfully');
    }

    /**
     * Change user role (volunteer <-> coordinator <-> admin)
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:volunteer,coordinator,admin',
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $request->role]);

        return $this->successResponse($user, "User {$user->name}'s role updated to {$request->role}");
    }

    /**
     * Update user details (Admin only)
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'role' => 'sometimes|in:volunteer,coordinator,admin',
            'location' => 'sometimes|nullable|string',
            'bio' => 'sometimes|nullable|string',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'location', 'bio']));

        return $this->successResponse($user, "User details updated successfully");
    }

    /**
     * Delete user account (Admin only)
     */
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        if ($admin->id === $id) {
            return $this->errorResponse('Cannot delete active logged-in admin account.', 400);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return $this->successResponse(null, 'User account deleted successfully');
    }
}
