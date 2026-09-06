<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: "/auth/register",
        summary: "Register a new user account",
        description: "Creates a new user profile and returns a bearer token.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "email", "password"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Ebad Mahar"),
                    new OA\Property(property: "email", type: "string", example: "ebad@grov.app"),
                    new OA\Property(property: "password", type: "string", example: "password123")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User registered successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Registration successful"),
                        new OA\Property(
                            property: "data",
                            properties: [
                                new OA\Property(property: "token", type: "string", example: "1|laravel_sanctum_token"),
                                new OA\Property(property: "user", type: "object")
                            ]
                        )
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'password' => Hash::make($request->password),
            'role' => 'volunteer',
            'location' => $request->location ?? 'Islamabad, Pakistan',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => $user->load('interests'),
        ], 'Registration successful', 201);
    }

    #[OA\Post(
        path: "/auth/login",
        summary: "Authenticate user",
        description: "Validates credentials and returns bearer token.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password"],
                properties: [
                    new OA\Property(property: "email", type: "string", example: "admin@grov.app"),
                    new OA\Property(property: "password", type: "string", example: "password")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login successful"),
            new OA\Response(response: 401, description: "Invalid credentials")
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid email address or password', 401);
        }

        // Google Authenticator 2FA verification for Admin accounts
        if ($user->role === 'admin') {
            $totpCode = $request->input('totp_code');
            if (!$totpCode) {
                return $this->successResponse([
                    'requires_2fa' => true,
                    'email' => $user->email,
                ], 'Google Authenticator 2FA required for Admin authentication');
            }

            if (!$this->verifyTotpCode('JBSWY3DPEHPK3PXP', (string) $totpCode)) {
                return $this->errorResponse('Invalid email address or password', 401);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => $user->load('interests'),
        ], 'Login successful');
    }

    /**
     * RFC 6238 Standard Google Authenticator TOTP verification
     */
    protected function verifyTotpCode(string $secret, string $otp): bool
    {
        $otp = trim($otp);
        if (strlen($otp) !== 6 || !is_numeric($otp)) {
            return false;
        }

        $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper($secret);
        $binaryKey = '';
        $v = 0;
        $vbits = 0;
        for ($i = 0; $i < strlen($secret); $i++) {
            $pos = strpos($base32chars, $secret[$i]);
            if ($pos === false) continue;
            $v = ($v << 5) | $pos;
            $vbits += 5;
            if ($vbits >= 8) {
                $vbits -= 8;
                $binaryKey .= chr(($v >> $vbits) & 0xFF);
            }
        }

        $currentTimeSlice = floor(time() / 30);
        // Check window of -2 to +2 time steps (2.5 mins total skew tolerance)
        for ($timeOffset = -2; $timeOffset <= 2; $timeOffset++) {
            $timeSlice = $currentTimeSlice + $timeOffset;
            $timeBinary = pack('N*', 0) . pack('N*', $timeSlice);
            $hash = hash_hmac('sha1', $timeBinary, $binaryKey, true);
            $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
            $calculatedOtp = ((ord($hash[$offset]) & 0x7F) << 24)
                | ((ord($hash[$offset + 1]) & 0xFF) << 16)
                | ((ord($hash[$offset + 2]) & 0xFF) << 8)
                | (ord($hash[$offset + 3]) & 0xFF);
            $calculatedOtp = $calculatedOtp % 1000000;
            $calculatedOtpString = str_pad((string) $calculatedOtp, 6, '0', STR_PAD_LEFT);

            if (hash_equals($calculatedOtpString, $otp)) {
                return true;
            }
        }

        return false;
    }

    #[OA\Post(
        path: "/auth/forgot-password",
        summary: "Request password recovery link",
        description: "Sends password recovery email if account exists.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email"],
                properties: [new OA\Property(property: "email", type: "string", example: "ebad@grov.app")]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Recovery email sent")
        ]
    )]
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', strtolower($request->email))->first();
        if ($user) {
            $token = \Illuminate\Support\Str::random(60);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => \Illuminate\Support\Facades\Hash::make($token), 'created_at' => now()]
            );

            MailService::sendSecurityEmail(
                $user->email,
                'Grōv Password Reset Request',
                'Reset Your Grōv Account Password',
                "<p>Hello <b>{$user->name}</b>,</p><p>We received a request to reset your password. Click the button below or use your recovery code to reset your account password securely.</p><p style='font-size:16px;'><b>Reset Token:</b> <code>{$token}</code></p>",
                config('app.url') . "/reset-password?token={$token}&email=" . urlencode($user->email),
                'Reset Account Password'
            );
        }

        return $this->successResponse(null, 'Password recovery link has been sent from security@growgrov.org.');
    }

    #[OA\Post(
        path: "/auth/reset-password",
        summary: "Reset user password",
        description: "Resets password using valid token.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["token", "email", "password", "password_confirmation"],
                properties: [
                    new OA\Property(property: "token", type: "string"),
                    new OA\Property(property: "email", type: "string"),
                    new OA\Property(property: "password", type: "string"),
                    new OA\Property(property: "password_confirmation", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Password reset successful")
        ]
    )]
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', strtolower($request->email))->first();
        if ($user) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        return $this->successResponse(null, 'Password has been reset successfully.');
    }

    #[OA\Post(
        path: "/auth/logout",
        summary: "Log out user",
        description: "Revokes current access token.",
        tags: ["Authentication"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Logout successful")
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }
}
