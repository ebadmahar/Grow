<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('location_id')->constrained()->onDelete('cascade');
            $table->enum('activity_type', ['plantation', 'seeding']);
            $table->enum('status', ['reported', 'verified', 'rejected'])->default('reported');
            $table->date('date');
            $table->text('field_notes')->nullable();
            $table->integer('points_awarded')->default(0);
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plantation_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('species_id')->constrained('species')->onDelete('cascade');
            $table->unsignedInteger('quantity_planted');
            $table->enum('planting_method', ['Pit Planting', 'Trench Planting', 'Mound Planting', 'Aerial Planting'])->default('Pit Planting');
            $table->timestamps();
        });

        Schema::create('seeding_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('species_id')->constrained('species')->onDelete('cascade');
            $table->unsignedInteger('seeds_dispersed');
            $table->enum('dispersal_method', ['Hand Broadcasting', 'Seed Bombing (aerial)', 'Seed Drill', 'Hydroseeding'])->default('Hand Broadcasting');
            $table->unsignedInteger('coverage_area_sqm')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seeding_activities');
        Schema::dropIfExists('plantation_activities');
        Schema::dropIfExists('activities');
    }
};
