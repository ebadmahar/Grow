<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\ActivityPhoto;
use App\Models\CommunityGoal;
use App\Models\CommunityTask;
use App\Models\CommunityTaskParticipant;
use App\Models\Interest;
use App\Models\Location;
use App\Models\MonitoringRecord;
use App\Models\Notification;
use App\Models\PlantationActivity;
use App\Models\Report;
use App\Models\SeedingActivity;
use App\Models\Species;
use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Disable Foreign Key checks for clean truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        DB::table('activity_photos')->truncate();
        DB::table('monitoring_records')->truncate();
        DB::table('plantation_activities')->truncate();
        DB::table('seeding_activities')->truncate();
        DB::table('activities')->truncate();
        DB::table('community_task_participants')->truncate();
        DB::table('community_tasks')->truncate();
        DB::table('reports')->truncate();
        DB::table('notifications')->truncate();
        DB::table('user_points')->truncate();
        DB::table('user_interests')->truncate();
        DB::table('locations')->truncate();
        DB::table('users')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Seed Interests & Species CATALOGUE
        $this->call([
            InterestSeeder::class,
            SpeciesSeeder::class,
        ]);

        // 2. Create EXACTLY 3 Users: 1 Admin, 1 Coordinator, 1 Volunteer User
        $admin = User::create([
            'name' => 'Admin Lead',
            'email' => 'admin@grov.app',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'location' => 'F-6 / Margalla Zone, Islamabad',
            'bio' => 'Grōv Platform Admin & Ecosystem Lead',
        ]);

        $coordinator = User::create([
            'name' => 'Field Coordinator',
            'email' => 'coordinator@grov.app',
            'password' => Hash::make('password123'),
            'role' => 'coordinator',
            'location' => 'G-11, Islamabad',
            'bio' => 'Senior Field Restoration Lead for Margalla Hills Zone.',
        ]);

        $volunteer = User::create([
            'name' => 'Restoration Volunteer',
            'email' => 'user@grov.app',
            'password' => Hash::make('password123'),
            'role' => 'volunteer',
            'location' => 'F-7, Islamabad',
            'bio' => 'Community restoration volunteer.',
        ]);

        // Attach default interests
        $allInterests = Interest::all();
        if ($allInterests->count() > 0) {
            $admin->interests()->sync($allInterests->pluck('id'));
            $coordinator->interests()->sync($allInterests->take(3)->pluck('id'));
            $volunteer->interests()->sync($allInterests->take(2)->pluck('id'));
        }

        // 3. Create default Monthly Goal
        CommunityGoal::updateOrCreate([
            'year' => (int) now()->format('Y'),
            'month' => (int) now()->format('m'),
        ], [
            'title' => 'Islamabad Monthly Ecosystem Restoration Target',
            'target_trees' => 10000,
            'target_seeds' => 5000,
            'target_monitoring' => 500,
            'target_participants' => 200,
            'status' => 'active',
        ]);
    }
}
