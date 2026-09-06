<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PingController extends Controller
{
    #[OA\Get(
        path: "/ping",
        summary: "API Health Check",
        description: "Returns operational status of Grōv API v1.",
        tags: ["System"],
        responses: [
            new OA\Response(
                response: 200,
                description: "API is operational",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Grōv API v1 is operational"),
                        new OA\Property(property: "timestamp", type: "string", example: "2026-08-27T20:00:00Z")
                    ]
                )
            )
        ]
    )]
    public function __invoke(): JsonResponse
    {
        return $this->successResponse([
            'status' => 'operational',
            'timestamp' => now()->toIso8601String(),
        ], 'Grōv API v1 is operational');
    }
}
