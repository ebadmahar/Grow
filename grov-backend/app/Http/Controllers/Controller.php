<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Grōv Restoration Platform API",
    description: "Production-quality REST API backend for Grōv field restoration tracking, monitoring, community hub, and leaderboard.",
    contact: new OA\Contact(name: "Grōv Engineering Team", email: "support@grov.app")
)]
#[OA\Server(
    url: "/api/v1",
    description: "Grōv Primary API Server v1"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    name: "Authorization",
    in: "header",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Enter Sanctum bearer token in format: Bearer {token}"
)]
abstract class Controller
{
    use ApiResponse;
}
