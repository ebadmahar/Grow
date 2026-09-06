<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('observation_date');
            $table->unsignedInteger('observed_count');
            $table->unsignedInteger('established_count');
            $table->unsignedInteger('surviving_count');
            $table->unsignedInteger('dead_count')->default(0);
            $table->enum('condition', ['Good', 'Fair', 'Poor', 'Unknown'])->default('Good');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_records');
    }
};
