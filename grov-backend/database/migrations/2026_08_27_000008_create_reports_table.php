<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('set null');
            $table->string('location_name');
            $table->enum('category', ['Pest / Disease', 'Fire Risk', 'Illegal Dumping', 'Illegal Cutting', 'Flooding / Erosion', 'Other'])->default('Other');
            $table->enum('severity', ['Low', 'Medium', 'High'])->default('Medium');
            $table->text('description');
            $table->enum('status', ['pending', 'investigating', 'resolved', 'dismissed'])->default('pending');
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
