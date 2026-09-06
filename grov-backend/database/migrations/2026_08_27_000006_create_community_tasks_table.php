<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('locations')->onDelete('cascade');
            $table->string('title');
            $table->enum('activity_type', ['Tree Plantation', 'Seed Bombing', 'Monitoring Visit', 'Site Survey', 'Mixed Activities'])->default('Tree Plantation');
            $table->date('date');
            $table->time('start_time')->default('07:00:00');
            $table->unsignedInteger('max_volunteers')->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image_path')->nullable();
            $table->enum('status', ['open', 'completed', 'cancelled'])->default('open');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('community_task_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('community_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['organizer', 'participant'])->default('participant');
            $table->enum('status', ['joined', 'cancelled'])->default('joined');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['task_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_task_participants');
        Schema::dropIfExists('community_tasks');
    }
};
