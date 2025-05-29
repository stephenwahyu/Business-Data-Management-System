<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Insert default roles
        DB::table('roles')->insert([
            ['name' => 'admin', 'description' => 'Administrator with full access', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'user', 'description' => 'General user with limited access', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'view', 'description' => 'Viewer with viewing access', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->foreignId('role_id')->default(2)->constrained(); // Default to general user (ID: 2)
            $table->rememberToken();
            $table->timestamps();
        });

        DB::table('users')->insert([
            ['name' => 'Admin', 'email' => 'admin@gmail.com', 'password' => Hash::make('password'), 'role_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'User', 'email' => 'user@gmail.com', 'password' => Hash::make('password'), 'role_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'View', 'email' => 'view@gmail.com', 'password' => Hash::make('password'), 'role_id' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('roles');
    }
};
