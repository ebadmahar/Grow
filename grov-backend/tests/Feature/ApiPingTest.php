<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiPingTest extends TestCase
{
    /**
     * Test API ping endpoint returns operational status.
     */
    public function test_api_ping_returns_success_json(): void
    {
        $response = $this->getJson('/api/v1/ping');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Grōv API v1 is operational',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'status',
                    'timestamp',
                ],
            ]);
    }

    /**
     * Test non-existent API route returns 404 JSON error.
     */
    public function test_non_existent_api_route_returns_404_json(): void
    {
        $response = $this->getJson('/api/v1/non-existent-endpoint');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Resource or endpoint not found',
            ]);
    }
}
