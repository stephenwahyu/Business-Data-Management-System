<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $users = User::with('role')->get();
        $roles = Role::all();
        
        // Fix: Use the correct component name that matches the file name
        return Inertia::render('manageusers', [
            'users' => $users,
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->back()->with('message', 'User created successfully.');
    }

    /**
     * Get a specific user's data.
     */
    public function get(User $user)
    {
        return response()->json($user->load('role'));
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'role_id' => 'required|exists:roles,id',
        ];

        // Only require password validation if provided
        if ($request->filled('password')) {
            $rules['password'] = 'string|min:8';
        }

        $validated = $request->validate($rules);

        // Manually apply capitalization to the name if needed
        $validated['name'] = ucwords(strtolower($validated['name']));

        // Update user data using update() method
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
        ]);

        // Update password if provided
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return redirect()->back()->with('message', 'User updated successfully.');
    }



    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Use Auth facade instead of auth() helper function
        // This approach is more IDE-friendly for Intelephense
        if (Auth::id() === $user->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }
    
        $user->delete();
    
        return redirect()->back()->with('message', 'User deleted successfully.');
    }
}