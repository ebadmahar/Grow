<?php

namespace Tests\Feature;

use App\Models\Species;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ActivityLoggingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_log_plantation_activity(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'ebad@grov.app')->first();
        $species = Species::first();

        $photo = UploadedFile::fake()->create('tree.jpg', 100, 'image/jpeg');

        $payload = [
            'species_id' => $species->id,
            'quantity_planted' => 150,
            'date' => '2026-08-27',
            'site_name' => 'Margalla Sector 4',
            'latitude' => 33.7400,
            'longitude' => 73.0700,
            'planting_method' => 'Pit Planting',
            'field_notes' => 'Test notes',
            'photos' => [$photo],
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/plantation', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Plantation activity logged successfully',
            ])
            ->assertJsonStructure([
                'data' => ['id', 'activity_type', 'status', 'points_awarded', 'plantation', 'photos'],
            ]);

        $this->assertDatabaseHas('plantation_activities', [
            'species_id' => $species->id,
            'quantity_planted' => 150,
        ]);

        // Points check: 150 * 10 + 50 (1 photo) = 1550 points
        $this->assertDatabaseHas('user_points', [
            'user_id' => $user->id,
            'points' => 1550,
        ]);
    }

    public function test_user_can_log_seeding_activity(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $species = Species::where('scientific_name', 'Acacia modesta')->first();

        $payload = [
            'species_id' => $species->id,
            'seeds_dispersed' => 600,
            'date' => '2026-08-27',
            'site_name' => 'G-11 Ridge',
            'latitude' => 33.7100,
            'longitude' => 73.1000,
            'dispersal_method' => 'Seed Bombing (aerial)',
            'coverage_area_sqm' => 3000,
            'field_notes' => 'Aerial seed bombing test',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/seeding', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'activity_type' => 'seeding',
                    'points_awarded' => 600,
                ],
            ]);

        $this->assertDatabaseHas('seeding_activities', [
            'seeds_dispersed' => 600,
        ]);
    }

    public function test_user_can_fetch_my_activities(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/activities/my-activities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'activity_type', 'status', 'date'],
                ],
            ]);
    }

    public function test_validation_prevents_invalid_quantities_or_coordinates(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $payload = [
            'species_id' => 1,
            'quantity_planted' => -10, // Invalid
            'date' => '2026-08-27',
            'site_name' => 'Invalid Site',
            'latitude' => 150.0000, // Out of bounds
            'longitude' => 73.0700,
            'planting_method' => 'Pit Planting',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/activities/plantation', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ]);
    }
}
