<?php

namespace Tests\Feature;

use App\Models\Interest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'New Restorer',
            'email' => 'new.restorer@grov.app',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ])
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email', 'role'],
                ],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'new.restorer@grov.app']);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        $payload = [
            'name' => 'Duplicate User',
            'email' => 'ebad@grov.app',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/v1/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $payload = [
            'email' => 'ebad@grov.app',
            'password' => 'password',
        ];

        $response = $this->postJson('/api/v1/auth/login', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ])
            ->assertJsonStructure([
                'data' => ['token', 'user'],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $payload = [
            'email' => 'ebad@grov.app',
            'password' => 'wrongpassword',
        ];

        $response = $this->postJson('/api/v1/auth/login', $payload);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid email address or password',
            ]);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/user/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => ['email' => 'ebad@grov.app'],
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/v1/user/profile');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated access',
            ]);
    }

    public function test_user_can_update_profile_and_interests(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $interest = Interest::first();

        $updateResponse = $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/user/profile', [
                'name' => 'Ebad Mahar Updated',
                'bio' => 'Updated bio text',
                'location' => 'Margalla Hills',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Ebad Mahar Updated');

        $interestsResponse = $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/user/interests', [
                'interest_ids' => [$interest->id],
            ]);

        $interestsResponse->assertStatus(200);
        $this->assertDatabaseHas('user_interests', [
            'user_id' => $user->id,
            'interest_id' => $interest->id,
        ]);
    }

    public function test_user_can_upload_avatar(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'ebad@grov.app')->first();
        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/user/avatar', [
                'avatar' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['avatar_url']]);
    }

    public function test_user_can_logout(): void
    {
        $user = User::where('email', 'ebad@grov.app')->first();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
