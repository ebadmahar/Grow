<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportAndAdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_submit_issue_report(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'ebad@grov.app')->first();
        $photo = UploadedFile::fake()->create('pest.jpg', 100, 'image/jpeg');

        $payload = [
            'site_name' => 'Margalla Hills Zone 2',
            'category' => 'Pest / Disease',
            'severity' => 'Medium',
            'description' => 'Aphid attack on young pine trees.',
            'photos' => [$photo],
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/reports', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Environmental report submitted successfully',
            ]);

        $this->assertDatabaseHas('reports', [
            'reporter_id' => $user->id,
            'category' => 'Pest / Disease',
        ]);
    }

    public function test_user_can_fetch_my_reports(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/reports/my-reports');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'location_name', 'category', 'severity', 'status'],
                ],
            ]);
    }

    public function test_admin_can_access_dashboard(): void
    {
        $admin = User::where('email', 'admin@grov.app')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['total_users', 'total_activities', 'trees_planted', 'pending_review'],
            ]);
    }

    public function test_normal_volunteer_cannot_access_admin_dashboard(): void
    {
        $volunteer = User::where('email', 'sara.khan@grov.app')->first();

        $response = $this->actingAs($volunteer, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthorized access. Administrative privileges required.',
            ]);
    }

    public function test_admin_can_verify_activity(): void
    {
        $admin = User::where('email', 'admin@grov.app')->first();
        $activity = Activity::where('status', 'reported')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/activities/{$activity->id}/verify", [
                'status' => 'verified',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'verified');

        $this->assertDatabaseHas('activities', [
            'id' => $activity->id,
            'status' => 'verified',
            'verified_by' => $admin->id,
        ]);
    }

    public function test_admin_can_resolve_report(): void
    {
        $admin = User::where('email', 'admin@grov.app')->first();
        $report = Report::first();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/reports/{$report->id}/resolve", [
                'status' => 'resolved',
                'resolution_notes' => 'Insecticide sprayed by field team.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'resolved',
            'resolved_by' => $admin->id,
        ]);
    }
}
