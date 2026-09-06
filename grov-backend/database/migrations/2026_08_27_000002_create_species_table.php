<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('species', function (Blueprint $table) {
            $table->id();
            $table->string('common_name');
            $table->string('scientific_name')->unique();
            $table->string('local_name')->nullable();
            $table->string('suitable_zones')->nullable();
            $table->text('basic_description')->nullable();
            $table->text('basic_guidance')->nullable();
            $table->enum('category', ['conifer', 'deciduous', 'mangrove', 'shrub', 'mixed'])->default('conifer');
            $table->boolean('is_native')->default(true);
            $table->boolean('is_active')->default(true);
            $table->string('cover_image_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('species');
    }
};
