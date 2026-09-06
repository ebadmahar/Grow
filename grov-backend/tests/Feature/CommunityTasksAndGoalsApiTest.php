<?php

namespace Tests\Feature;

use App\Models\CommunityTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityTasksAndGoalsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_create_community_task(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $payload = [
            'title' => 'Rawal Lake Survey',
            'activity_type' => 'Site Survey',
            'site_name' => 'Rawal Lake Point A',
            'latitude' => 33.7020,
            'longitude' => 73.1250,
            'date' => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '08:00:00',
            'max_volunteers' => 15,
            'description' => 'Survey site conditions for next plantation drive.',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/community/tasks', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Community task created successfully',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'title', 'max_volunteers', 'location', 'active_participants'],
            ]);
    }

    public function test_user_can_join_community_task(): void
    {
        $user = User::factory()->create();

        // Create task with max 5 volunteers
        $task = CommunityTask::first();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/community/tasks/{$task->id}/join");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'task_id' => $task->id,
                    'status' => 'joined',
                ],
            ]);
    }

    public function test_user_cannot_join_full_community_task(): void
    {
        $user = User::where('email', 'sara.khan@grov.app')->first();
        $task = CommunityTask::first();
        $task->update(['max_volunteers' => 1]); // Set capacity to 1 (already filled by organizer)

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/community/tasks/{$task->id}/join");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Task capacity reached. Cannot join full task.',
            ]);
    }

    public function test_user_can_leave_community_task(): void
    {
        $user = User::where('email', 'sara.khan@grov.app')->first();
        $task = CommunityTask::first();

        // Join first
        $this->actingAs($user, 'sanctum')->postJson("/api/v1/community/tasks/{$task->id}/join");

        // Leave task
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/community/tasks/{$task->id}/leave");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'cancelled',
                ],
            ]);
    }

    public function test_can_fetch_monthly_goal_progress(): void
    {
        $response = $this->getJson('/api/v1/goals/monthly');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => ['title', 'period', 'completion_percentage', 'trees_planted', 'target_trees', 'sub_goals'],
            ]);
    }
}
