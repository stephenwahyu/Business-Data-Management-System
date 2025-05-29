<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class Role
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return redirect('login');
        }
        
        $user = Auth::user();
        
        // Check if user has one of the required roles (by ID)
        if (in_array($user->role_id, $roles)) {
            return $next($request);
        }
        
        // If using Inertia, redirect with an error message
        return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
    }
}