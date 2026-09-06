<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MonitoringApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_submit_monitoring_record(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'ebad@grov.app')->first();
        $activity = Activity::first();
        $photo = UploadedFile::fake()->create('obs.jpg', 100, 'image/jpeg');

        $payload = [
            'activity_id' => $activity->id,
            'observation_date' => '2026-08-27',
            'observed_count' => 96,
            'established_count' => 82,
            'surviving_count' => 78,
            'dead_count' => 4,
            'condition' => 'Good',
            'notes' => 'Observed steady growth',
            'photos' => [$photo],
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/monitoring/records', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Monitoring record submitted successfully',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'observed_count', 'established_count', 'surviving_count', 'dead_count', 'condition', 'photos'],
            ]);

        $this->assertDatabaseHas('monitoring_records', [
            'activity_id' => $activity->id,
            'observed_count' => 96,
            'surviving_count' => 78,
        ]);
    }

    public function test_validation_prevents_impossible_counts(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $activity = Activity::first();

        $payload = [
            'activity_id' => $activity->id,
            'observation_date' => '2026-08-27',
            'observed_count' => 50,
            'established_count' => 60, // Impossible: established > observed
            'surviving_count' => 50,
            'dead_count' => 0,
            'condition' => 'Good',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/monitoring/records', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ]);
    }

    public function test_user_can_fetch_monitoring_history(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/monitoring/records');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'observation_date', 'observed_count', 'surviving_count'],
                ],
            ]);
    }

    public function test_user_can_fetch_activity_monitoring_history(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $activity = Activity::first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/activities/{$activity->id}/monitoring");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'activity_id',
                    'monitoring_records',
                ],
            ]);
    }
}
