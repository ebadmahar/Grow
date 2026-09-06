<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_goals', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->integer('year');
            $table->integer('month');
            $table->unsignedInteger('target_trees')->default(100000);
            $table->unsignedInteger('target_seeds')->default(50000);
            $table->unsignedInteger('target_monitoring')->default(200);
            $table->unsignedInteger('target_participants')->default(200);
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->timestamps();

            $table->unique(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_goals');
    }
};
