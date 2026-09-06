<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class LeaderboardController extends Controller
{
    public function __construct(
        protected LeaderboardService $leaderboardService
    ) {}

    #[OA\Get(
        path: "/leaderboard",
        summary: "Get regional leaderboard rankings",
        tags: ["Leaderboard & Points"],
        parameters: [
            new OA\Parameter(name: "tab", in: "query", schema: new OA\Schema(type: "string", enum: ["plantation", "seeding", "community"])),
            new OA\Parameter(name: "period", in: "query", schema: new OA\Schema(type: "string", enum: ["monthly", "all_time"]))
        ],
        responses: [
            new OA\Response(response: 200, description: "Leaderboard retrieved successfully")
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $tab = $request->get('tab', 'plantation');
        $period = $request->get('period', 'monthly');

        $rankings = $this->leaderboardService->getLeaderboard($tab, $period);

        return $this->successResponse([
            'tab' => $tab,
            'period' => $period,
            'rankings' => $rankings,
        ], 'Leaderboard retrieved successfully');
    }

    #[OA\Get(
        path: "/leaderboard/my-ranking",
        summary: "Get current user's detailed ranking breakdown",
        tags: ["Leaderboard & Points"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "User ranking breakdown retrieved successfully")
        ]
    )]
    public function myRanking(Request $request): JsonResponse
    {
        $user = $request->user();
        $rankingDetails = $this->leaderboardService->getUserRanking($user);

        return $this->successResponse($rankingDetails, 'My ranking retrieved successfully');
    }
}
