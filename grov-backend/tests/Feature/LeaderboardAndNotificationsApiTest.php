<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardAndNotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_fetch_leaderboard_rankings(): void
    {
        $response = $this->getJson('/api/v1/leaderboard?tab=plantation&period=monthly');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'tab' => 'plantation',
                    'period' => 'monthly',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'rankings' => [
                        '*' => ['rank', 'id', 'name', 'trees_planted', 'seeds_dispersed', 'points'],
                    ],
                ],
            ]);
    }

    public function test_authenticated_user_can_fetch_my_ranking(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/leaderboard/my-ranking');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'rank' => '#1',
                ],
            ])
            ->assertJsonStructure([
                'data' => ['rank', 'user', 'monthly_points', 'metrics', 'status_message'],
            ]);
    }

    public function test_authenticated_user_can_fetch_notifications(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'unread_count',
                    'timeline' => ['today', 'yesterday', 'this_week'],
                ],
            ]);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $notif = Notification::where('user_id', $user->id)->first();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('data.is_read', true);

        $this->assertDatabaseHas('notifications', [
            'id' => $notif->id,
            'is_read' => true,
        ]);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/notifications/mark-all-read');

        $response->assertStatus(200);

        $this->assertEquals(0, Notification::where('user_id', $user->id)->where('is_read', false)->count());
    }
}
