<?php

namespace Tests\Feature;

use App\Models\Species;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpeciesAndMapApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_list_species_catalogue(): void
    {
        $response = $this->getJson('/api/v1/species');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'common_name', 'scientific_name', 'category', 'is_native'],
                ],
            ]);
    }

    public function test_can_filter_species_by_category(): void
    {
        $response = $this->getJson('/api/v1/species?category=conifer');

        $response->assertStatus(200);
        $this->assertEquals('conifer', $response->json('data.0.category'));
    }

    public function test_can_fetch_single_species_details(): void
    {
        $species = Species::first();

        $response = $this->getJson("/api/v1/species/{$species->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $species->id,
                    'scientific_name' => $species->scientific_name,
                ],
            ]);
    }

    public function test_returns_404_for_invalid_species_id(): void
    {
        $response = $this->getJson('/api/v1/species/999999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Species not found',
            ]);
    }

    public function test_can_fetch_map_pins(): void
    {
        $response = $this->getJson('/api/v1/activities/map');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'activity_type', 'status', 'count', 'species', 'latitude', 'longitude'],
                ],
            ]);
    }

    public function test_can_fetch_explore_map_stats(): void
    {
        $response = $this->getJson('/api/v1/locations/explore');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['total_planted', 'active_sites', 'regional_survival_rate'],
            ]);
    }
}
