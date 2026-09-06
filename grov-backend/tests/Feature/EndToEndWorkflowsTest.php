<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\CommunityTask;
use App\Models\Interest;
use App\Models\Report;
use App\Models\Species;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EndToEndWorkflowsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /** Workflow 1: Register -> Setup profile -> Select interests -> View dashboard */
    public function test_workflow_1_registration_to_profile_setup(): void
    {
        // 1. Register
        $regResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Workflow User',
            'email' => 'workflow.user@grov.app',
            'password' => 'password123',
        ]);
        $token = $regResponse->json('data.token');
        $this->assertNotEmpty($token);

        // 2. Select interests
        $interest = Interest::first();
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/user/interests', [
                'interest_ids' => [$interest->id],
            ])->assertStatus(200);

        // 3. Setup profile
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/v1/user/profile', [
                'location' => 'Margalla Hills Zone 3',
                'bio' => 'Dedicated restoration lead',
                'role' => 'coordinator',
            ])->assertStatus(200);

        // 4. View profile
        $profileResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/user/profile');

        $profileResponse->assertStatus(200)
            ->assertJsonPath('data.user.location', 'Margalla Hills Zone 3')
            ->assertJsonPath('data.user.role', 'coordinator');
    }

    /** Workflow 2: Create plantation -> Upload evidence -> Save GPS -> Appears in My Activities */
    public function test_workflow_2_plantation_logging_and_retrieval(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'ebad@grov.app')->first();
        $species = Species::first();
        $photo = UploadedFile::fake()->create('sapling.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/plantation', [
                'species_id' => $species->id,
                'quantity_planted' => 200,
                'date' => '2026-08-27',
                'site_name' => 'Margalla Sector 5',
                'latitude' => 33.7420,
                'longitude' => 73.0720,
                'planting_method' => 'Pit Planting',
                'field_notes' => 'Workflow 2 test plantation',
                'photos' => [$photo],
            ]);

        $response->assertStatus(201);
        $activityId = $response->json('data.id');

        // Check My Activities list
        $listResponse = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/activities/my-activities?filter=plantation');

        $listResponse->assertStatus(200);
        $this->assertTrue(collect($listResponse->json('data'))->pluck('id')->contains($activityId));
    }

    /** Workflow 3: Create plantation -> Add monitoring record -> View history */
    public function test_workflow_3_plantation_monitoring_lifecycle(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $activity = Activity::where('activity_type', 'plantation')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/monitoring/records', [
                'activity_id' => $activity->id,
                'observation_date' => '2026-08-27',
                'observed_count' => 100,
                'established_count' => 90,
                'surviving_count' => 85,
                'dead_count' => 5,
                'condition' => 'Good',
                'notes' => 'Workflow 3 observation notes',
            ]);

        $response->assertStatus(201);

        $historyResponse = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/activities/{$activity->id}/monitoring");

        $historyResponse->assertStatus(200)
            ->assertJsonPath('data.monitoring_records.0.surviving_count', 85);
    }

    /** Workflow 4: Create seed bombing activity -> Save GPS -> Add monitoring */
    public function test_workflow_4_seed_bombing_and_monitoring(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $species = Species::where('scientific_name', 'Acacia modesta')->first();

        $seedingResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/seeding', [
                'species_id' => $species->id,
                'seeds_dispersed' => 1000,
                'date' => '2026-08-27',
                'site_name' => 'Rawal Ridge',
                'latitude' => 33.7050,
                'longitude' => 73.1200,
                'dispersal_method' => 'Seed Bombing (aerial)',
                'coverage_area_sqm' => 5000,
            ]);

        $seedingResponse->assertStatus(201);
        $activityId = $seedingResponse->json('data.id');

        $monResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/monitoring/records', [
                'activity_id' => $activityId,
                'observation_date' => '2026-08-27',
                'observed_count' => 450,
                'established_count' => 350,
                'surviving_count' => 320,
                'dead_count' => 30,
                'condition' => 'Fair',
            ]);

        $monResponse->assertStatus(201);
    }

    /** Workflow 5: Create task -> Volunteer joins -> Participant count updates */
    public function test_workflow_5_community_task_lifecycle(): void
    {
        $organizer = User::where('email', 'ebad@grov.app')->first();
        $volunteer = User::factory()->create();

        $taskResponse = $this->actingAs($organizer, 'sanctum')
            ->postJson('/api/v1/community/tasks', [
                'title' => 'Shakarparian Drive',
                'activity_type' => 'Tree Plantation',
                'site_name' => 'Shakarparian Entrance',
                'latitude' => 33.6930,
                'longitude' => 73.0680,
                'date' => now()->addDays(3)->format('Y-m-d'),
                'start_time' => '07:30:00',
                'max_volunteers' => 20,
                'description' => 'Planting indigenous trees.',
            ]);

        $taskResponse->assertStatus(201);
        $taskId = $taskResponse->json('data.id');

        // Join
        $this->actingAs($volunteer, 'sanctum')
            ->postJson("/api/v1/community/tasks/{$taskId}/join")
            ->assertStatus(200);

        // Fetch task details
        $detailResponse = $this->getJson("/api/v1/community/tasks/{$taskId}");
        $detailResponse->assertStatus(200)
            ->assertJsonPath('data.participants_count', 2);
    }

    /** Workflow 6: Log activity -> Points awarded -> Leaderboard updated */
    public function test_workflow_6_points_and_leaderboard_update(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $species = Species::first();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/plantation', [
                'species_id' => $species->id,
                'quantity_planted' => 500,
                'date' => '2026-08-27',
                'site_name' => 'Leaderboard Test Site',
                'latitude' => 33.7380,
                'longitude' => 73.0650,
                'planting_method' => 'Pit Planting',
            ])->assertStatus(201);

        $lbResponse = $this->getJson('/api/v1/leaderboard?tab=plantation&period=monthly');
        $lbResponse->assertStatus(200);
        $this->assertEquals($user->id, $lbResponse->json('data.rankings.0.id'));
    }

    /** Workflow 7: Admin reviews activity -> Approves -> Notification generated */
    public function test_workflow_7_admin_verification_flow(): void
    {
        $admin = User::where('email', 'admin@grov.app')->first();
        $activity = Activity::where('status', 'reported')->first();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/activities/{$activity->id}/verify", [
                'status' => 'verified',
            ])->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $activity->user_id,
            'type' => 'verification',
        ]);
    }

    /** Workflow 8: User reports issue -> Admin reviews and resolves report */
    public function test_workflow_8_issue_report_and_resolution(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $admin = User::where('email', 'admin@grov.app')->first();

        $reportResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/reports', [
                'site_name' => 'Margalla Ridge',
                'category' => 'Fire Risk',
                'severity' => 'High',
                'description' => 'Dry brush accumulation creating fire hazard.',
            ]);

        $reportResponse->assertStatus(201);
        $reportId = $reportResponse->json('data.id');

        $resolveResponse = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/reports/{$reportId}/resolve", [
                'status' => 'resolved',
                'resolution_notes' => 'Fire break cleared by forest department.',
            ]);

        $resolveResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');
    }
}
