<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateInterestsRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UpdateSettingsRequest;
use App\Http\Requests\User\UploadAvatarRequest;
use App\Models\Interest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: "/user/profile",
        summary: "Get current user profile",
        description: "Returns profile details, statistics, role, and selected interests.",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Profile retrieved successfully")
        ]
    )]
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('interests');

        $plantedCount = $user->activities()
            ->where('status', 'verified')
            ->whereHas('plantation')
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $activitiesCount = $user->activities()->where('status', 'verified')->count();
        $ranking = (new \App\Services\LeaderboardService())->getUserRanking($user);

        $stats = [
            'total_planted' => $plantedCount,
            'total_activities' => $activitiesCount,
            'rank' => $ranking['rank'] ?? '#1',
        ];

        return $this->successResponse([
            'user' => $user,
            'stats' => $stats,
        ], 'Profile retrieved successfully');
    }

    #[OA\Put(
        path: "/user/profile",
        summary: "Update profile details",
        description: "Updates name, location, bio, or role.",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "location", type: "string"),
                    new OA\Property(property: "bio", type: "string"),
                    new OA\Property(property: "role", type: "string", enum: ["volunteer", "coordinator"])
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Profile updated successfully")
        ]
    )]
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return $this->successResponse($user->load('interests'), 'Profile updated successfully');
    }

    #[OA\Post(
        path: "/user/avatar",
        summary: "Upload profile avatar photo",
        description: "Stores avatar image file and updates user avatar_path.",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "avatar", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Avatar uploaded successfully")
        ]
    )]
    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = asset('storage/' . $path);

        $user->update(['avatar_path' => $avatarUrl]);

        return $this->successResponse([
            'avatar_url' => $avatarUrl,
        ], 'Avatar uploaded successfully');
    }

    #[OA\Get(
        path: "/user/interests",
        summary: "List all interest tags & user selected interests",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Interests retrieved successfully")
        ]
    )]
    public function getInterests(Request $request): JsonResponse
    {
        $allInterests = Interest::all();
        $selectedIds = $request->user()->interests()->pluck('interests.id')->toArray();

        return $this->successResponse([
            'interests' => $allInterests,
            'selected_ids' => $selectedIds,
        ], 'Interests retrieved successfully');
    }

    #[OA\Put(
        path: "/user/interests",
        summary: "Update user interest tag selection",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "interest_ids", type: "array", items: new OA\Items(type: "integer"))
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Interests updated successfully")
        ]
    )]
    public function updateInterests(UpdateInterestsRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->interests()->sync($request->interest_ids);

        return $this->successResponse($user->load('interests'), 'Interests updated successfully');
    }

    #[OA\Put(
        path: "/user/settings",
        summary: "Update notification and application settings",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "settings", type: "object")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Settings updated successfully")
        ]
    )]
    public function updateSettings(UpdateSettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $mergedSettings = array_merge($user->settings_json ?? [], $request->settings);
        $user->update(['settings_json' => $mergedSettings]);

        return $this->successResponse([
            'settings' => $user->settings_json,
        ], 'Settings updated successfully');
    }

    #[OA\Delete(
        path: "/user/account",
        summary: "Delete user account",
        description: "Soft deletes user account.",
        tags: ["User Profile"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Account deleted successfully")
        ]
    )]
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()?->delete();
        $user->delete();

        return $this->successResponse(null, 'Account deleted successfully');
    }
}
