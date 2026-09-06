<?php

namespace Database\Seeders;

use App\Models\Interest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InterestSeeder extends Seeder
{
    public function run(): void
    {
        $interests = [
            'Tree Plantation',
            'Seed Bombing',
            'Monitoring',
            'Mangroves',
            'Reforestation',
            'Native Species',
            'Wetlands',
            'Urban Greening',
            'Community Tasks',
            'Data Collection',
        ];

        foreach ($interests as $name) {
            Interest::firstOrCreate([
                'slug' => Str::slug($name),
            ], [
                'name' => $name,
            ]);
        }
    }
}
