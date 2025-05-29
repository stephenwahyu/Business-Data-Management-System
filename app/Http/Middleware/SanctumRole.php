<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanctumRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  mixed  ...$roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is authenticated via Sanctum
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = $request->user();
        
        // Check if user has one of the required roles (by ID)
        if (in_array($user->role_id, $roles)) {
            return $next($request);
        }
        
        // User doesn't have the required role
        return response()->json(['message' => 'Forbidden: insufficient permissions'], 403);
    }
}