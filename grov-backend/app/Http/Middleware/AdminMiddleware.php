<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['admin', 'coordinator'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access. Administrative privileges required.',
            ], 403);
        }

        return $next($request);
    }
}
