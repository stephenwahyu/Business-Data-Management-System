<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('placeId')->index(); // Indexed for faster lookups
            $table->string('placeName')->index(); // Indexed for searching and sorting
            $table->text('placeAddress')->nullable();
            $table->string('placeDistrict')->nullable()->index(); // Indexed for filtering
            $table->string('placeBusinessStatus')->nullable()->index(); // Indexed for filtering
            $table->string('placeStatus')->nullable()->index(); // Indexed for filtering
            $table->string('placeTypes')->nullable();
            $table->string('placeLatitude');
            $table->string('placeLongitude');
            $table->string('placeCategory')->index(); // Indexed for filtering
            $table->text('description')->nullable();
            $table->string('source')->nullable();
            $table->boolean('isCurrent')->default(true)->index(); // Indexed for frequent queries
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();


            // Composite indexes for common query patterns
            $table->index(['placeId', 'isCurrent']);
            $table->index(['isCurrent', 'placeCategory']);
            $table->index(['isCurrent', 'placeBusinessStatus']);
            $table->index(['isCurrent', 'placeStatus']);
            $table->index(['created_at']); // For sorting by creation date
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};