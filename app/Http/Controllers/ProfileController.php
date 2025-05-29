<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Show the profile edit form.
     */
    public function edit()
    {
        return Inertia::render('settings/profile');
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
                'email' => [
                    'required', 
                    'string', 
                    'email:rfc,dns', 
                    'max:255', 
                    Rule::unique('users')->ignore($user->id)
                ],
            ], [
                'name.regex' => 'Name may only contain letters and spaces.',
                'email.email' => 'Please enter a valid email address.',
            ]);

            // Only update if data actually changed
            $changes = array_diff_assoc($validated, $user->only(['name', 'email']));
            
            if (empty($changes)) {
                return back()->with([
                    'status' => 'no-changes',
                    'message' => 'No changes detected to save.'
                ]);
            }

            $user->update($changes);
            
            // Clear email verification only if email changed
            if (isset($changes['email'])) {
                $user->update(['email_verified_at' => null]);
                return back()->with([
                    'status' => 'profile-updated-email-changed',
                    'message' => 'Profile updated successfully! Please verify your new email address.'
                ]);
            }
            
            return back()->with([
                'status' => 'profile-updated',
                'message' => 'Profile updated successfully!'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->with([
                'status' => 'validation-failed',
                'message' => 'Please correct the errors below.'
            ]);
        } catch (\Exception $e) {
            
            return back()->with([
                'status' => 'update-failed',
                'message' => 'Something went wrong while updating your profile. Please try again.'
            ]);
        }
    }

    /**
     * Show the password edit form.
     */
    public function editPassword()
    {
        return Inertia::render('settings/password');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'current_password' => ['required', 'current_password'],
                'password' => [
                    'required', 
                    'confirmed',
                    Password::min(8)
                        ->letters()
                        ->mixedCase()
                        ->numbers()
                        ->symbols()
                ],
            ], [
                'current_password.current_password' => 'The current password is incorrect.',
                'password.confirmed' => 'Password confirmation does not match.',
            ]);

            Auth::user()->update([
                'password' => Hash::make($validated['password']),
            ]);

            return back()->with([
                'status' => 'password-updated',
                'message' => 'Password updated successfully!'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->with([
                'status' => 'validation-failed',
                'message' => 'Please correct the errors below.'
            ]);
        } catch (\Exception $e) {
            
            return back()->with([
                'status' => 'password-update-failed',
                'message' => 'Something went wrong while updating your password. Please try again.'
            ]);
        }
    }
}