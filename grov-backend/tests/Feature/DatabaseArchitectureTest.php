<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\CommunityGoal;
use App\Models\CommunityTask;
use App\Models\Interest;
use App\Models\Location;
use App\Models\MonitoringRecord;
use App\Models\Notification;
use App\Models\Report;
use App\Models\Species;
use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_seeded_users_and_relationships_exist(): void
    {
        $ebad = User::where('email', 'ebad@grov.app')->first();
        $this->assertNotNull($ebad);
        $this->assertEquals('coordinator', $ebad->role);

        // Check Interests relationship
        $this->assertGreaterThan(0, $ebad->interests()->count());

        // Check Activities relationship
        $this->assertEquals(2, $ebad->activities()->count());
    }

    public function test_plantation_and_seeding_activities_structure(): void
    {
        $plantation = Activity::where('activity_type', 'plantation')->first();
        $this->assertNotNull($plantation);
        $this->assertNotNull($plantation->plantation);
        $this->assertGreaterThan(0, $plantation->plantation->quantity_planted);

        $seeding = Activity::where('activity_type', 'seeding')->first();
        $this->assertNotNull($seeding);
        $this->assertNotNull($seeding->seeding);
        $this->assertGreaterThan(0, $seeding->seeding->seeds_dispersed);
    }

    public function test_monitoring_records_and_community_tasks_relationships(): void
    {
        $monitoring = MonitoringRecord::first();
        $this->assertNotNull($monitoring);
        $this->assertNotNull($monitoring->activity);

        $task = CommunityTask::first();
        $this->assertNotNull($task);
        $this->assertEquals(3, $task->activeParticipants()->count());
    }

    public function test_community_goals_and_reports_seeded(): void
    {
        $goal = CommunityGoal::where('year', 2026)->where('month', 8)->first();
        $this->assertNotNull($goal);
        $this->assertEquals(100000, $goal->target_trees);

        $report = Report::first();
        $this->assertNotNull($report);
        $this->assertEquals('pending', $report->status);
    }
}
