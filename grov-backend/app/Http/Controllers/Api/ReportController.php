<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\StoreReportRequest;
use App\Models\ActivityPhoto;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class ReportController extends Controller
{
    #[OA\Get(
        path: "/reports/my-reports",
        summary: "List issue reports submitted by current user",
        tags: ["Environmental Reports"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "User reports retrieved successfully")
        ]
    )]
    public function myReports(Request $request): JsonResponse
    {
        $reports = Report::with(['photos', 'resolver'])
            ->where('reporter_id', $request->user()->id)
            ->latest()
            ->get();

        return $this->successResponse($reports, 'User reports retrieved successfully');
    }

    #[OA\Post(
        path: "/reports",
        summary: "Submit an environmental issue report",
        description: "Logs issue category, severity, location, notes, and evidence photos.",
        tags: ["Environmental Reports"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["site_name", "category", "severity", "description"],
                    properties: [
                        new OA\Property(property: "activity_id", type: "integer"),
                        new OA\Property(property: "site_name", type: "string", example: "Margalla Hills Zone 2"),
                        new OA\Property(property: "category", type: "string", enum: ["Pest / Disease", "Fire Risk", "Illegal Dumping", "Illegal Cutting", "Flooding / Erosion", "Other"]),
                        new OA\Property(property: "severity", type: "string", enum: ["Low", "Medium", "High"]),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "photos[]", type: "array", items: new OA\Items(type: "string", format: "binary"))
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Environmental report submitted successfully")
        ]
    )]
    public function store(StoreReportRequest $request): JsonResponse
    {
        $user = $request->user();

        $report = DB::transaction(function () use ($request, $user) {
            $report = Report::create([
                'reporter_id' => $user->id,
                'activity_id' => $request->activity_id,
                'location_name' => $request->site_name,
                'category' => $request->category,
                'severity' => $request->severity,
                'description' => $request->description,
                'status' => 'pending',
            ]);

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $file) {
                    $path = $file->store('evidence', 'public');
                    ActivityPhoto::create([
                        'report_id' => $report->id,
                        'file_path' => asset('storage/' . $path),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getClientMimeType(),
                    ]);
                }
            }

            return $report;
        });

        return $this->successResponse(
            $report->load('photos'),
            'Environmental report submitted successfully',
            201
        );
    }
}
