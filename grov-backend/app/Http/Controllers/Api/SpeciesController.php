<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Species;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SpeciesController extends Controller
{
    #[OA\Get(
        path: "/species",
        summary: "List species catalogue",
        description: "Returns list of active plant and seed species with optional category and native filters.",
        tags: ["Species Catalogue"],
        parameters: [
            new OA\Parameter(name: "category", in: "query", schema: new OA\Schema(type: "string", enum: ["conifer", "deciduous", "mangrove", "shrub", "mixed"])),
            new OA\Parameter(name: "is_native", in: "query", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "search", in: "query", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Species list retrieved successfully")
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Species::query()->where('is_active', true);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('is_native')) {
            $query->where('is_native', filter_var($request->is_native, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('common_name', 'like', "%{$search}%")
                  ->orWhere('scientific_name', 'like', "%{$search}%")
                  ->orWhere('local_name', 'like', "%{$search}%");
            });
        }

        $species = $query->orderBy('common_name')->get();

        return $this->successResponse($species, 'Species catalogue retrieved successfully');
    }

    #[OA\Get(
        path: "/species/{id}",
        summary: "Get species details",
        description: "Returns detailed information, suitable zones, description, and planting guidance for a single species.",
        tags: ["Species Catalogue"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Species details retrieved successfully"),
            new OA\Response(response: 404, description: "Species not found")
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $species = Species::find($id);

        if (!$species) {
            return $this->errorResponse('Species not found', 404);
        }

        return $this->successResponse($species, 'Species details retrieved successfully');
    }
}
