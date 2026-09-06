<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('community_tasks')->onDelete('set null');
            $table->integer('points');
            $table->string('reason');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_points');
    }
};
