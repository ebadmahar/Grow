<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\CommunityGoal;
use App\Models\CommunityTask;
use App\Models\Interest;
use App\Models\Location;
use App\Models\LocationAqi;
use App\Models\Notification;
use App\Models\Report;
use App\Models\Species;
use App\Models\User;
use App\Services\PointsCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AdminWebController extends Controller
{
    public function __construct(
        protected PointsCalculatorService $pointsCalculator
    ) {}

    /**
     * Show Web Admin Login Page
     */
    public function showLogin()
    {
        if (session('admin_authenticated')) {
            return redirect('/admin/dashboard');
        }
        return view('admin.login');
    }

    /**
     * Authenticate Web Admin Login with Google Authenticator 2FA
     */
    public function processLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password) || $user->role !== 'admin') {
            return back()->withErrors(['auth' => 'Invalid password or email'])->withInput();
        }

        // 2FA Google Authenticator Check for Admin Role
        $totpCode = $request->input('totp_code');
        if (!$totpCode) {
            return back()->with('requires_2fa', true)->with('email', $user->email)->withInput();
        }

        if (!$this->verifyTotpCode('JBSWY3DPEHPK3PXP', (string) $totpCode)) {
            return back()->withErrors(['auth' => 'Invalid password or email'])->withInput();
        }

        session(['admin_authenticated' => true, 'admin_user_id' => $user->id, 'admin_user_name' => $user->name]);

        return redirect('/admin/dashboard')->with('success', 'Admin session authenticated with Google Authenticator 2FA.');
    }

    /**
     * RFC 6238 Standard Google Authenticator TOTP verification
     */
    protected function verifyTotpCode(string $secret, string $otp): bool
    {
        $otp = trim($otp);
        if (strlen($otp) !== 6 || !is_numeric($otp)) {
            return false;
        }

        $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper($secret);
        $binaryKey = '';
        $v = 0;
        $vbits = 0;
        for ($i = 0; $i < strlen($secret); $i++) {
            $pos = strpos($base32chars, $secret[$i]);
            if ($pos === false) continue;
            $v = ($v << 5) | $pos;
            $vbits += 5;
            if ($vbits >= 8) {
                $vbits -= 8;
                $binaryKey .= chr(($v >> $vbits) & 0xFF);
            }
        }

        $currentTimeSlice = floor(time() / 30);
        // Check window of -2 to +2 time steps (2.5 mins total skew tolerance)
        for ($timeOffset = -2; $timeOffset <= 2; $timeOffset++) {
            $timeSlice = $currentTimeSlice + $timeOffset;
            $timeBinary = pack('N*', 0) . pack('N*', $timeSlice);
            $hash = hash_hmac('sha1', $timeBinary, $binaryKey, true);
            $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
            $calculatedOtp = ((ord($hash[$offset]) & 0x7F) << 24)
                | ((ord($hash[$offset + 1]) & 0xFF) << 16)
                | ((ord($hash[$offset + 2]) & 0xFF) << 8)
                | (ord($hash[$offset + 3]) & 0xFF);
            $calculatedOtp = $calculatedOtp % 1000000;
            $calculatedOtpString = str_pad((string) $calculatedOtp, 6, '0', STR_PAD_LEFT);

            if (hash_equals($calculatedOtpString, $otp)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Render Full Enterprise Web Admin Dashboard
     */
    public function dashboard()
    {
        if (!session('admin_authenticated')) {
            return redirect('/admin');
        }

        $users = User::withCount('activities')->latest()->get();
        $totalUsers = $users->count();
        $totalActivities = Activity::count();
        $treesPlanted = Activity::where('activity_type', 'plantation')
            ->with('plantation')
            ->get()
            ->sum(fn ($act) => $act->plantation->quantity_planted ?? 0);

        $pendingActivities = Activity::where('status', 'reported')
            ->with(['user', 'location', 'plantation.species', 'seeding.species', 'photos'])
            ->latest()
            ->get();

        $reports = Report::with(['reporter', 'resolver'])->latest()->get();
        $speciesList = Species::all();
        $communityTasks = CommunityTask::with('location')->latest()->get();

        $currentMonth = (int) now()->format('m');
        $currentYear = (int) now()->format('Y');
        $goal = CommunityGoal::where('year', $currentYear)->where('month', $currentYear)->first() 
            ?? CommunityGoal::first();

        $currentAqi = Cache::get('manual_aqi_override') ?? [
          'aqi' => 42,
          'status' => 'Good',
          'source' => Cache::has('google_aqi_api_key') ? 'Google Air Quality API' : 'Open-Meteo Sensor'
        ];

        $googleAqiKey = Cache::get('google_aqi_api_key', '');
        $totpSecret = 'JBSWY3DPEHPK3PXP';

        // ── Interest Analytics ─────────────────────────────────────────
        $interestStats = Interest::withCount('users')
            ->orderByDesc('users_count')
            ->get()
            ->map(fn ($interest) => [
                'name'  => $interest->name,
                'count' => $interest->users_count,
            ]);

        $totalWithInterests = User::has('interests')->count();
        $usersWithoutInterests = $totalUsers - $totalWithInterests;
        $topInterest = $interestStats->first();

        // ── Live AQI from DB cache ─────────────────────────────────────
        $cachedAqi = LocationAqi::getForLocation('islamabad');
        $currentAqi = Cache::get('manual_aqi_override') ?? ($cachedAqi ? $cachedAqi->toAqiPayload() : [
            'aqi' => 42, 'status' => 'Good',
            'source' => 'Baseline (no data yet)',
            'last_updated_at' => null,
        ]);

        $smtpSettings = \App\Services\MailService::getSmtpSettings();

        return view('admin.dashboard', compact(
            'users',
            'totalUsers',
            'totalActivities',
            'treesPlanted',
            'pendingActivities',
            'reports',
            'speciesList',
            'communityTasks',
            'goal',
            'currentAqi',
            'googleAqiKey',
            'totpSecret',
            'interestStats',
            'usersWithoutInterests',
            'topInterest',
            'smtpSettings'
        ));
    }

    /**
     * Save / Update Google Air Quality API Key
     */
    public function updateGoogleAqiKey(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $key = trim($request->input('google_api_key', ''));
        if ($key) {
            Cache::put('google_aqi_api_key', $key, 86400 * 365);
            Cache::forget('islamabad_google_aqi');
            return redirect('/admin/dashboard')->with('success', 'Google Air Quality API Key saved successfully!');
        } else {
            Cache::forget('google_aqi_api_key');
            return redirect('/admin/dashboard')->with('success', 'Google Air Quality API Key cleared.');
        }
    }

    /**
     * User Management: Create User
     */
    public function createUser(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:volunteer,coordinator,admin',
        ]);

        User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'location' => 'Islamabad, Pakistan',
        ]);

        return redirect('/admin/dashboard')->with('success', "User account {$request->name} created successfully with role '{$request->role}'.");
    }

    /**
     * User Management: Update User Role (volunteer <-> coordinator <-> admin)
     */
    public function updateUserRole(Request $request, int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $user = User::findOrFail($id);
        $request->validate(['role' => 'required|in:volunteer,coordinator,admin']);

        $user->update(['role' => $request->role]);

        return redirect('/admin/dashboard')->with('success', "User {$user->name}'s role updated to '{$request->role}'.");
    }

    /**
     * User Management: Reset User Password
     */
    public function resetUserPassword(Request $request, int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $user = User::findOrFail($id);
        $request->validate(['password' => 'required|min:6']);

        $user->update(['password' => Hash::make($request->password)]);

        return redirect('/admin/dashboard')->with('success', "Password for {$user->name} reset successfully.");
    }

    /**
     * User Management: Delete User
     */
    public function deleteUser(int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $user = User::findOrFail($id);
        if ($user->id === session('admin_user_id')) {
            return redirect('/admin/dashboard')->with('error', 'Cannot delete active logged-in admin account.');
        }

        $user->delete();
        return redirect('/admin/dashboard')->with('success', "User account deleted.");
    }

    /**
     * AQI Control & Air Quality Override
     */
    public function updateAqi(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        if ($request->has('reset_auto')) {
            Cache::forget('manual_aqi_override');
            return redirect('/admin/dashboard')->with('success', 'AQI reset to live sensor API.');
        }

        $request->validate([
            'aqi' => 'required|integer|min:1|max:500',
            'status' => 'required|string',
        ]);

        Cache::put('manual_aqi_override', [
            'location' => 'Margalla Hills Zone, Islamabad',
            'aqi' => (int) $request->aqi,
            'status' => $request->status,
            'pm10' => round($request->aqi * 0.6),
            'pm2_5' => round($request->aqi * 0.3),
            'source' => 'Admin Custom Sensor Override',
        ], 86400 * 30);

        return redirect('/admin/dashboard')->with('success', "Air Quality Index overridden to AQI {$request->aqi} ({$request->status}).");
    }

    /**
     * Species Management: Add New Species
     */
    public function createSpecies(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate([
            'common_name' => 'required|string',
            'scientific_name' => 'required|string',
            'type' => 'required|in:Tree,Shrub,Seed',
        ]);

        Species::create([
            'common_name' => $request->common_name,
            'scientific_name' => $request->scientific_name,
            'type' => $request->type,
            'native_region' => 'Margalla Hills / Northern Pakistan',
            'description' => $request->description ?? 'Native ecological restoration species.',
        ]);

        return redirect('/admin/dashboard')->with('success', "Species {$request->common_name} added to catalogue.");
    }

    /**
     * Species Management: Delete Species
     */
    public function deleteSpecies(int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        Species::destroy($id);
        return redirect('/admin/dashboard')->with('success', 'Species deleted.');
    }

    /**
     * Community Tasks / Drives Manager: Create Drive
     */
    public function createDrive(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate([
            'title' => 'required|string',
            'site_name' => 'required|string',
            'activity_type' => 'required|string',
            'date' => 'required|date',
        ]);

        $location = Location::create([
            'name' => $request->site_name,
            'latitude' => 33.7294,
            'longitude' => 73.0931,
            'region' => 'Islamabad, Pakistan',
        ]);

        CommunityTask::create([
            'creator_id' => session('admin_user_id'),
            'location_id' => $location->id,
            'title' => $request->title,
            'activity_type' => $request->activity_type,
            'date' => $request->date,
            'start_time' => '08:00:00',
            'max_volunteers' => $request->max_volunteers ?? 50,
            'description' => $request->description ?? 'Community field restoration drive.',
            'status' => 'open',
        ]);

        return redirect('/admin/dashboard')->with('success', "Community Restoration Drive '{$request->title}' created.");
    }

    /**
     * Activity Moderation: Verify Activity
     */
    public function verifyActivity(Request $request, int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $activity = Activity::with(['plantation', 'seeding', 'photos'])->findOrFail($id);
        $status = $request->input('status', 'verified');
        $previousStatus = $activity->status;

        $activity->update([
            'status' => $status,
            'verified_by' => session('admin_user_id'),
            'verified_at' => now(),
        ]);

        if ($status === 'verified' && $previousStatus !== 'verified') {
            $photoCount = $activity->photos ? $activity->photos->count() : 0;
            if ($activity->activity_type === 'plantation' && $activity->plantation) {
                $this->pointsCalculator->calculateAndAwardPlantation(
                    $activity,
                    $activity->plantation->quantity_planted,
                    $photoCount
                );
            } elseif ($activity->activity_type === 'seeding' && $activity->seeding) {
                $this->pointsCalculator->calculateAndAwardSeeding(
                    $activity,
                    $activity->seeding->seeds_dispersed,
                    $photoCount
                );
            }

            Notification::create([
                'user_id' => $activity->user_id,
                'type' => 'verification',
                'title' => 'Activity Verified & Points Awarded',
                'message' => 'Your submission has been verified by Admin! Points credited.',
                'is_read' => false,
            ]);
        }

        return redirect('/admin/dashboard')->with('success', 'Activity marked as ' . $status . '!');
    }

    /**
     * Goals Manager: Update Monthly Goals
     */
    public function updateGoals(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate(['target_trees' => 'required|integer|min:100']);

        $currentMonth = (int) now()->format('m');
        $currentYear = (int) now()->format('Y');

        $goal = CommunityGoal::firstOrCreate([
            'year' => $currentYear,
            'month' => $currentMonth,
        ], [
            'title' => 'Community Planting Goal',
            'target_trees' => 100000,
            'target_seeds' => 50000,
            'target_monitoring' => 200,
            'target_participants' => 200,
            'status' => 'active',
        ]);

        $goal->update([
            'target_trees' => $request->target_trees,
            'target_seeds' => $request->target_seeds ?? $goal->target_seeds,
        ]);

        return redirect('/admin/dashboard')->with('success', 'Monthly community goals updated!');
    }

    /**
     * Broadcast Notification to All Users
     */
    public function broadcastNotification(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $users = User::all();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'system',
                'title' => $request->title,
                'message' => $request->message,
                'is_read' => false,
            ]);
        }

        return redirect('/admin/dashboard')->with('success', 'Broadcast notification dispatched to all community users!');
    }

    /**
     * Report Resolution
     */
    public function resolveReport(Request $request, int $id)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $report = Report::findOrFail($id);
        $report->update([
            'status' => $request->input('status', 'resolved'),
            'resolution_notes' => 'Processed via Enterprise Web Admin Portal.',
            'resolved_by' => session('admin_user_id'),
            'resolved_at' => now(),
        ]);

        return redirect('/admin/dashboard')->with('success', 'Report status updated!');
    }

    /**
     * Save Dual-SMTP Configuration Settings
     */
    public function updateSmtp(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $settings = [
            'noreply' => [
                'host' => $request->input('noreply_host', '127.0.0.1'),
                'port' => (int) $request->input('noreply_port', 2525),
                'encryption' => $request->input('noreply_encryption', 'tls'),
                'username' => $request->input('noreply_username', 'noreply@growgrov.org'),
                'password' => $request->input('noreply_password', ''),
                'from_address' => $request->input('noreply_from_address', 'noreply@growgrov.org'),
                'from_name' => $request->input('noreply_from_name', 'Grōv Notifications & Updates'),
            ],
            'security' => [
                'host' => $request->input('security_host', '127.0.0.1'),
                'port' => (int) $request->input('security_port', 2525),
                'encryption' => $request->input('security_encryption', 'tls'),
                'username' => $request->input('security_username', 'security@growgrov.org'),
                'password' => $request->input('security_password', ''),
                'from_address' => $request->input('security_from_address', 'security@growgrov.org'),
                'from_name' => $request->input('security_from_name', 'Grōv Account Security'),
            ],
        ];

        \App\Services\MailService::saveSmtpSettings($settings);

        return redirect('/admin/dashboard')->with('success', 'Dual-SMTP Settings (noreply@growgrov.org & security@growgrov.org) updated successfully.');
    }

    /**
     * Send Test HTML Email
     */
    public function sendTestEmail(Request $request)
    {
        if (!session('admin_authenticated')) return redirect('/admin');

        $request->validate([
            'mailer' => 'required|in:noreply,security',
            'recipient' => 'required|email',
        ]);

        $mailer = $request->mailer;
        $recipient = $request->recipient;

        if ($mailer === 'security') {
            $sent = \App\Services\MailService::sendSecurityEmail(
                $recipient,
                'Test Security Email from Grōv',
                'Grōv Security SMTP Verification',
                '<p>This is a test HTML security email sent via <b>security@growgrov.org</b> mailer transport.</p>'
            );
        } else {
            $sent = \App\Services\MailService::sendNotificationEmail(
                $recipient,
                'Test Notification Email from Grōv',
                'Grōv Notifications SMTP Verification',
                '<p>This is a test HTML newsletter email sent via <b>noreply@growgrov.org</b> mailer transport.</p>'
            );
        }

        if ($sent) {
            return redirect('/admin/dashboard')->with('success', "Test HTML email sent successfully to {$recipient} via {$mailer}@growgrov.org.");
        } else {
            return redirect('/admin/dashboard')->with('error', "Failed to send test email via {$mailer} mailer transport. Check server logs.");
        }
    }

    /**
     * Logout
     */
    public function logout()
    {
        session()->forget(['admin_authenticated', 'admin_user_id', 'admin_user_name']);
        return redirect('/admin')->with('success', 'Signed out of Web Admin Portal.');
    }
}
