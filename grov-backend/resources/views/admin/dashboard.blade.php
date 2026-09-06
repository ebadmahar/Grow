<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Grōv — Enterprise Web Admin Suite</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"/>
  <style>
    :root {
      --ink: #0F1512;
      --lime: #C8FF55;
      --surface: #F4F7F0;
      --card: #FFFFFF;
      --card-border: #E2E8DC;
      --text-1: #0F1512;
      --text-2: #3A5040;
      --text-muted: #809684;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #16201B; color: var(--text-1); min-height: 100vh; display: flex; }
    
    /* Sidebar Layout */
    aside { width: 260px; background: #0F1512; color: #fff; padding: 24px; display: flex; flex-direction: column; gap: 20px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.08); }
    .brand-title { font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--lime); color: var(--ink); display: grid; place-items: center; font-size: 18px; font-weight: 800; }
    .nav-menu { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; color: #9DAF9A; text-decoration: none; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
    .nav-item:hover, .nav-item.active { background: rgba(200,255,85,0.12); color: var(--lime); }
    .nav-item .material-icons-round { font-size: 18px; }
    
    .admin-profile { border-top: 1px solid rgba(255,255,255,0.1); paddingTop: 16px; display: flex; align-items: center; justify-content: space-between; }
    .logout-link { color: #FCA5A5; text-decoration: none; font-size: 12px; font-weight: 700; }

    /* Main Area */
    main { flex: 1; background: var(--surface); overflow-y: auto; padding: 32px; }
    .header-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-h1 { font-size: 24px; font-weight: 800; color: var(--ink); }
    
    .flash-alert { background: #EAF9EF; border: 1px solid #C8FF55; color: #1A6636; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 700; margin-bottom: 24px; }

    .grid-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: var(--card); padding: 20px; border-radius: 16px; border: 1px solid var(--card-border); }
    .stat-val { font-size: 28px; font-weight: 800; color: var(--ink); line-height: 1; }
    .stat-lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-top: 6px; }

    .panel-card { background: var(--card); border-radius: 16px; border: 1px solid var(--card-border); overflow: hidden; margin-bottom: 28px; padding: 24px; }
    .panel-h2 { font-size: 17px; font-weight: 800; color: var(--ink); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #FAFDF6; padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-2); border-bottom: 1px solid var(--card-border); }
    td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid var(--card-border); }
    
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .role-admin { background: #0F1512; color: var(--lime); }
    .role-coordinator { background: #E0F4FF; color: #0891B2; }
    .role-volunteer { background: #EAF9EF; color: #1A6636; }

    .btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .btn-dark { background: var(--ink); color: #fff; }
    .btn-lime { background: var(--lime); color: var(--ink); }
    .btn-danger { background: #FEE2E2; color: #991B1B; }

    .form-group { margin-bottom: 14px; }
    .form-label { font-size: 10px; font-weight: 800; color: var(--text-2); text-transform: uppercase; margin-bottom: 6px; display: block; }
    .form-input { width: 100%; height: 42px; border-radius: 8px; border: 1.5px solid var(--card-border); padding: 0 12px; font-size: 13px; outline: none; }
    .form-select { width: 100%; height: 42px; border-radius: 8px; border: 1.5px solid var(--card-border); padding: 0 12px; font-size: 13px; outline: none; background: #fff; }

    .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .secret-box { background: #0F1512; color: var(--lime); padding: 16px; border-radius: 12px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 12px 0; }
  </style>
</head>
<body>

<!-- Sidebar Navigation -->
<aside>
  <div class="brand-title">
    <div class="brand-icon"><span class="material-icons-round">forest</span></div>
    <span>Grōv Admin</span>
  </div>

  <nav class="nav-menu">
    <button class="nav-item active" onclick="showPanel('overview')"><span class="material-icons-round">dashboard</span> Overview</button>
    <button class="nav-item" onclick="showPanel('users')"><span class="material-icons-round">people</span> User Management CRUD</button>
    <button class="nav-item" onclick="showPanel('verification')"><span class="material-icons-round">fact_check</span> Moderation Queue</button>
    <button class="nav-item" onclick="showPanel('aqi')"><span class="material-icons-round">air</span> AQI Control &amp; Sensor</button>
    <button class="nav-item" onclick="showPanel('2fa')"><span class="material-icons-round">security</span> 2FA Authenticator Setup</button>
    <button class="nav-item" onclick="showPanel('smtp')"><span class="material-icons-round">email</span> Dual-SMTP Settings</button>
    <button class="nav-item" onclick="showPanel('species')"><span class="material-icons-round">park</span> Species Catalogue</button>
    <button class="nav-item" onclick="showPanel('drives')"><span class="material-icons-round">groups</span> Community Drives</button>
    <button class="nav-item" onclick="showPanel('goals')"><span class="material-icons-round">flag</span> Monthly Goals &amp; Broadcast</button>
    <button class="nav-item" onclick="showPanel('reports')"><span class="material-icons-round">bug_report</span> Threat &amp; Bug Reports</button>
    <button class="nav-item" onclick="showPanel('analytics')"><span class="material-icons-round">bar_chart</span> Interest Analytics</button>
  </nav>

  <div class="admin-profile">
    <div>
      <div style="font-size:13px;font-weight:800;color:#fff;">{{ session('admin_user_name') }}</div>
      <div style="font-size:10px;color:var(--lime);">Platform Admin</div>
    </div>
    <a href="/admin/logout" class="logout-link">Sign Out</a>
  </div>
</aside>

<!-- Main Workspace -->
<main>
  <div class="header-bar">
    <h1 class="header-h1" id="panelHeading">Enterprise Admin Dashboard</h1>
    <div style="font-size:12px;font-weight:700;color:var(--text-2);">Islamabad Region · Live System</div>
  </div>

  @if(session('success'))
    <div class="flash-alert">{{ session('success') }}</div>
  @endif

  <!-- Overview Stats Grid -->
  <div class="grid-stats">
    <div class="stat-card">
      <div class="stat-val">{{ $totalUsers }}</div>
      <div class="stat-lbl">Registered Members</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">{{ number_format($treesPlanted) }}</div>
      <div class="stat-lbl">Trees Planted</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">{{ count($pendingActivities) }}</div>
      <div class="stat-lbl">Pending Review</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:#0891B2;">AQI {{ $currentAqi['aqi'] ?? 42 }}</div>
      <div class="stat-lbl">Live AQI ({{ $currentAqi['status'] ?? 'Good' }})</div>
    </div>
  </div>

  <!-- Panel 1: Overview -->
  <div id="panelOverview" class="panel-section">
    <div class="panel-card">
      <div class="panel-h2">Quick Actions &amp; System Health</div>
      <p style="font-size:13px;color:var(--text-2);margin-bottom:16px;">Welcome to the Grōv Enterprise Web Admin Suite. You have full control over user roles, activity approvals, live AQI settings, community goals, and platform broadcasts.</p>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-dark" onclick="showPanel('users')"><span class="material-icons-round">people</span> Manage Users &amp; Roles</button>
        <button class="btn btn-dark" onclick="showPanel('verification')"><span class="material-icons-round">fact_check</span> Review Pending Submissions ({{ count($pendingActivities) }})</button>
        <button class="btn btn-dark" onclick="showPanel('aqi')"><span class="material-icons-round">air</span> Override AQI</button>
      </div>
    </div>
  </div>

  <!-- Panel 2: User Management CRUD -->
  <div id="panelUsers" class="panel-section" style="display:none;">
    <div class="split-grid" style="margin-bottom:24px;">
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Create New User Account</div>
        <form method="POST" action="/admin/users/create">
          @csrf
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" name="name" class="form-input" placeholder="e.g. Sara Khan" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" class="form-input" placeholder="sara@grov.app" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-input" placeholder="••••••••" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Assign System Role</label>
            <select name="role" class="form-select">
              <option value="volunteer">Volunteer (User)</option>
              <option value="coordinator">Field Coordinator</option>
              <option value="admin">Platform Admin</option>
            </select>
          </div>
          <button type="submit" class="btn btn-dark" style="width:100%;">Create User Account</button>
        </form>
      </div>

      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">User Role Permissions Matrix</div>
        <p style="font-size:12px;color:var(--text-2);line-height:18;margin-bottom:12px;">
          • <b>Volunteer:</b> Can log field activities, drop pins, monitor sites, and report issues.<br>
          • <b>Field Coordinator:</b> Can create Community Restoration Drives and approve user submissions.<br>
          • <b>Platform Admin:</b> Full system access (User CRUD, AQI override, 2FA secret, monthly targets, broadcasts).
        </p>
      </div>
    </div>

    <div class="panel-card">
      <div class="panel-h2">Registered Platform Users ({{ count($users) }})</div>
      <table>
        <thead>
          <tr>
            <th>Name &amp; Email</th>
            <th>Current Role</th>
            <th>Logged Activities</th>
            <th>Change Role</th>
            <th>Reset Password</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          @foreach($users as $u)
            <tr>
              <td>
                <b>{{ $u->name }}</b><br>
                <span style="font-size:11px;color:var(--text-muted);">{{ $u->email }}</span>
              </td>
              <td>
                <span class="badge role-{{ $u->role }}">{{ ucfirst($u->role) }}</span>
              </td>
              <td><b>{{ $u->activities_count }}</b> submissions</td>
              <td>
                <form method="POST" action="/admin/users/{{ $u->id }}/role" style="display:flex;gap:4px;">
                  @csrf
                  <select name="role" class="form-select" style="height:32px;font-size:11px;padding:0 6px;">
                    <option value="volunteer" {{ $u->role === 'volunteer' ? 'selected' : '' }}>Volunteer</option>
                    <option value="coordinator" {{ $u->role === 'coordinator' ? 'selected' : '' }}>Coordinator</option>
                    <option value="admin" {{ $u->role === 'admin' ? 'selected' : '' }}>Admin</option>
                  </select>
                  <button type="submit" class="btn btn-dark" style="padding:4px 8px;font-size:10px;">Update</button>
                </form>
              </td>
              <td>
                <form method="POST" action="/admin/users/{{ $u->id }}/reset-password" style="display:flex;gap:4px;">
                  @csrf
                  <input type="password" name="password" placeholder="New Pass" class="form-input" style="height:32px;font-size:11px;width:90px;" required/>
                  <button type="submit" class="btn btn-dark" style="padding:4px 8px;font-size:10px;">Reset</button>
                </form>
              </td>
              <td>
                @if($u->id !== session('admin_user_id'))
                  <form method="POST" action="/admin/users/{{ $u->id }}/delete" onsubmit="return confirm('Delete user {{ $u->name }}?');">
                    @csrf
                    <button type="submit" class="btn btn-danger" style="padding:4px 8px;font-size:10px;">Delete</button>
                  </form>
                @else
                  <span style="font-size:10px;color:var(--text-muted);">Active Admin</span>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>

  <!-- Panel 3: Moderation Queue -->
  <div id="panelVerification" class="panel-section" style="display:none;">
    <div class="panel-card">
      <div class="panel-h2">Pending Activity Moderation Queue ({{ count($pendingActivities) }})</div>
      <table>
        <thead>
          <tr>
            <th>Location / Site</th>
            <th>Type</th>
            <th>Logged By</th>
            <th>Quantity</th>
            <th>Field Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @forelse($pendingActivities as $act)
            @php
              $qty = $act->activity_type === 'plantation'
                ? ($act->plantation->quantity_planted ?? 0)
                : ($act->seeding->seeds_dispersed ?? 0);
            @endphp
            <tr>
              <td><b>{{ $act->location->name ?? 'Field Site' }}</b></td>
              <td>{{ ucfirst($act->activity_type) }}</td>
              <td>{{ $act->user->name ?? 'Member' }}</td>
              <td>{{ $qty }} {{ $act->activity_type === 'plantation' ? 'Saplings' : 'Seeds' }}</td>
              <td>{{ $act->field_notes ?? 'No notes' }}</td>
              <td>
                <form method="POST" action="/admin/activities/{{ $act->id }}/verify" style="display:inline-block;">
                  @csrf
                  <input type="hidden" name="status" value="verified"/>
                  <button type="submit" class="btn btn-dark" style="background:#0F1512;color:#C8FF55;">Approve &amp; Award Points</button>
                </form>

                <form method="POST" action="/admin/activities/{{ $act->id }}/verify" style="display:inline-block;margin-left:4px;">
                  @csrf
                  <input type="hidden" name="status" value="rejected"/>
                  <button type="submit" class="btn btn-danger">Reject</button>
                </form>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">All submissions verified!</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <!-- Panel 4: AQI Control & API Key Manager -->
  <div id="panelAqi" class="panel-section" style="display:none;">
    <div class="split-grid">
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">AQI Custom Override</div>
        <p style="font-size:12px;color:var(--text-2);margin-bottom:14px;">Currently Active Source: <b>{{ $currentAqi['source'] ?? 'Live Sensor' }}</b></p>
        
        <form method="POST" action="/admin/aqi">
          @csrf
          <div class="form-group">
            <label class="form-label">Set Custom AQI Value (1 - 500)</label>
            <input type="number" name="aqi" class="form-input" value="{{ $currentAqi['aqi'] ?? 42 }}" required/>
          </div>

          <div class="form-group">
            <label class="form-label">Air Quality Status</label>
            <select name="status" class="form-select">
              <option value="Good" {{ ($currentAqi['status'] ?? '') === 'Good' ? 'selected' : '' }}>Good (0 - 50)</option>
              <option value="Moderate" {{ ($currentAqi['status'] ?? '') === 'Moderate' ? 'selected' : '' }}>Moderate (51 - 100)</option>
              <option value="Unhealthy for Sensitive Groups" {{ ($currentAqi['status'] ?? '') === 'Unhealthy for Sensitive Groups' ? 'selected' : '' }}>Unhealthy for Sensitive Groups (101 - 150)</option>
              <option value="Unhealthy" {{ ($currentAqi['status'] ?? '') === 'Unhealthy' ? 'selected' : '' }}>Unhealthy (151+)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-dark" style="width:100%;margin-bottom:8px;">Override Live AQI Value</button>
        </form>

        <form method="POST" action="/admin/aqi">
          @csrf
          <input type="hidden" name="reset_auto" value="1"/>
          <button type="submit" class="btn btn-danger" style="width:100%;">Reset to Sensor API</button>
        </form>
      </div>

      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Google Air Quality API Key</div>
        <p style="font-size:12px;color:var(--text-2);line-height:18px;margin-bottom:14px;">
          Integrate the official <b>Google Air Quality API</b> (Google Maps Platform). Enter your Google Cloud API Key below to query live AQI data directly for user locations:
        </p>

        <form method="POST" action="/admin/google-aqi-key">
          @csrf
          <div class="form-group">
            <label class="form-label">Google Air Quality API Key</label>
            <input type="text" name="google_api_key" class="form-input" placeholder="AIzaSy..." value="{{ $googleAqiKey }}"/>
          </div>

          <button type="submit" class="btn btn-dark" style="width:100%;">Save Google Air Quality API Key</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Panel 5: 2FA Setup -->
  <div id="panel2fa" class="panel-section" style="display:none;">
    <div class="panel-card" style="max-width:550px;">
      <div class="panel-h2">Admin Google Authenticator 2FA Setup</div>
      <p style="font-size:13px;color:var(--text-2);line-height:20px;">To connect your Google Authenticator app on your phone, add a new account using setup key mode and enter the secret code below:</p>
      
      <div class="secret-box">{{ $totpSecret }}</div>

      <div style="font-size:12px;color:var(--text-2);line-height:20px;">
        <b>Step-by-Step Google Authenticator Setup:</b><br>
        1. Open <b>Google Authenticator</b> on your phone.<br>
        2. Tap <b>+</b> -> <b>Enter a setup key</b>.<br>
        3. Account Name: <b>Grōv Platform Admin</b><br>
        4. Your Key: <b>{{ $totpSecret }}</b><br>
        5. Key Type: Time-based (TOTP).<br><br>
        <i>Now, whenever you log in as Admin, enter the live 6-digit OTP code generated by your Google Authenticator app.</i>
      </div>
    </div>
  </div>

  <!-- Panel: Dual-SMTP Mailer Settings -->
  <div id="panelSmtp" class="panel-section" style="display:none;">
    <div class="split-grid" style="margin-bottom:24px;">
      
      <!-- Mailer 1: noreply@growgrov.org -->
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">1. Onboarding &amp; Notifications SMTP (noreply@growgrov.org)</div>
        <p style="font-size:12px;color:var(--text-2);line-height:18px;">Used for sending welcome emails, community announcements, newsletters, and milestone alerts.</p>
        <form method="POST" action="/admin/smtp/update">
          @csrf
          <input type="hidden" name="mailer_type" value="noreply"/>
          <div class="form-group">
            <label class="form-label">SMTP Host</label>
            <input type="text" name="noreply_host" value="{{ $smtpSettings['noreply']['host'] ?? '127.0.0.1' }}" class="form-input" required/>
          </div>
          <div class="split-grid" style="grid-template-columns: 1fr 1fr; gap:10px; margin:0;">
            <div class="form-group">
              <label class="form-label">Port</label>
              <input type="number" name="noreply_port" value="{{ $smtpSettings['noreply']['port'] ?? 2525 }}" class="form-input" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Encryption</label>
              <select name="noreply_encryption" class="form-select">
                <option value="tls" {{ ($smtpSettings['noreply']['encryption'] ?? 'tls') === 'tls' ? 'selected' : '' }}>TLS</option>
                <option value="ssl" {{ ($smtpSettings['noreply']['encryption'] ?? '') === 'ssl' ? 'selected' : '' }}>SSL</option>
                <option value="none" {{ ($smtpSettings['noreply']['encryption'] ?? '') === 'none' ? 'selected' : '' }}>None</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" name="noreply_username" value="{{ $smtpSettings['noreply']['username'] ?? 'noreply@growgrov.org' }}" class="form-input" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="noreply_password" value="{{ $smtpSettings['noreply']['password'] ?? '' }}" class="form-input" placeholder="••••••••"/>
          </div>
          <div class="form-group">
            <label class="form-label">From Address</label>
            <input type="email" name="noreply_from_address" value="{{ $smtpSettings['noreply']['from_address'] ?? 'noreply@growgrov.org' }}" class="form-input" required/>
          </div>
          <div class="form-group">
            <label class="form-label">From Sender Name</label>
            <input type="text" name="noreply_from_name" value="{{ $smtpSettings['noreply']['from_name'] ?? 'Grōv Notifications & Updates' }}" class="form-input" required/>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Save Onboarding SMTP</button>
        </form>
      </div>

      <!-- Mailer 2: security@growgrov.org -->
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">2. Account Security &amp; 2FA SMTP (security@growgrov.org)</div>
        <p style="font-size:12px;color:var(--text-2);line-height:18px;">Used for password resets, account verification, 2FA alerts, and security notices.</p>
        <form method="POST" action="/admin/smtp/update">
          @csrf
          <input type="hidden" name="mailer_type" value="security"/>
          <div class="form-group">
            <label class="form-label">SMTP Host</label>
            <input type="text" name="security_host" value="{{ $smtpSettings['security']['host'] ?? '127.0.0.1' }}" class="form-input" required/>
          </div>
          <div class="split-grid" style="grid-template-columns: 1fr 1fr; gap:10px; margin:0;">
            <div class="form-group">
              <label class="form-label">Port</label>
              <input type="number" name="security_port" value="{{ $smtpSettings['security']['port'] ?? 2525 }}" class="form-input" required/>
            </div>
            <div class="form-group">
              <label class="form-label">Encryption</label>
              <select name="security_encryption" class="form-select">
                <option value="tls" {{ ($smtpSettings['security']['encryption'] ?? 'tls') === 'tls' ? 'selected' : '' }}>TLS</option>
                <option value="ssl" {{ ($smtpSettings['security']['encryption'] ?? '') === 'ssl' ? 'selected' : '' }}>SSL</option>
                <option value="none" {{ ($smtpSettings['security']['encryption'] ?? '') === 'none' ? 'selected' : '' }}>None</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" name="security_username" value="{{ $smtpSettings['security']['username'] ?? 'security@growgrov.org' }}" class="form-input" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="security_password" value="{{ $smtpSettings['security']['password'] ?? '' }}" class="form-input" placeholder="••••••••"/>
          </div>
          <div class="form-group">
            <label class="form-label">From Address</label>
            <input type="email" name="security_from_address" value="{{ $smtpSettings['security']['from_address'] ?? 'security@growgrov.org' }}" class="form-input" required/>
          </div>
          <div class="form-group">
            <label class="form-label">From Sender Name</label>
            <input type="text" name="security_from_name" value="{{ $smtpSettings['security']['from_name'] ?? 'Grōv Account Security' }}" class="form-input" required/>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Save Security SMTP</button>
        </form>
      </div>
    </div>

    <!-- Dispatch HTML Test Email -->
    <div class="panel-card" style="max-width:600px;">
      <div class="panel-h2">Dispatch Test HTML Email</div>
      <p style="font-size:12px;color:var(--text-2);">Test your SMTP credentials and verify the responsive HTML email template delivery.</p>
      <form method="POST" action="/admin/smtp/test">
        @csrf
        <div class="form-group">
          <label class="form-label">Select SMTP Transport</label>
          <select name="mailer" class="form-select">
            <option value="noreply">noreply@growgrov.org (Onboarding &amp; Notifications)</option>
            <option value="security">security@growgrov.org (Security &amp; Password Reset)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Recipient Email Address</label>
          <input type="email" name="recipient" class="form-input" placeholder="admin@example.com" required/>
        </div>
        <button type="submit" class="btn btn-primary">Send Test HTML Email</button>
      </form>
    </div>
  </div>

  <!-- Panel 6: Species Catalogue -->
  <div id="panelSpecies" class="panel-section" style="display:none;">
    <div class="split-grid" style="margin-bottom:24px;">
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Add Native Species</div>
        <form method="POST" action="/admin/species/create">
          @csrf
          <div class="form-group">
            <label class="form-label">Common Name</label>
            <input type="text" name="common_name" class="form-input" placeholder="e.g. Phulai" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Scientific Name</label>
            <input type="text" name="scientific_name" class="form-input" placeholder="e.g. Acacia modesta" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select name="type" class="form-select">
              <option value="Tree">Tree Sapling</option>
              <option value="Shrub">Native Shrub</option>
              <option value="Seed">Seed Variety</option>
            </select>
          </div>
          <button type="submit" class="btn btn-dark" style="width:100%;">Add Species to Catalogue</button>
        </form>
      </div>

      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Species Catalogue ({{ count($speciesList) }})</div>
        <table>
          <thead>
            <tr>
              <th>Common Name</th>
              <th>Scientific Name</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @foreach($speciesList as $s)
              <tr>
                <td><b>{{ $s->common_name }}</b></td>
                <td><i>{{ $s->scientific_name }}</i></td>
                <td>{{ $s->type }}</td>
                <td>
                  <form method="POST" action="/admin/species/{{ $s->id }}/delete">
                    @csrf
                    <button type="submit" class="btn btn-danger" style="padding:4px 8px;font-size:10px;">Delete</button>
                  </form>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Panel 7: Community Drives -->
  <div id="panelDrives" class="panel-section" style="display:none;">
    <div class="split-grid" style="margin-bottom:24px;">
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Create Community Restoration Drive</div>
        <form method="POST" action="/admin/drives/create">
          @csrf
          <div class="form-group">
            <label class="form-label">Drive Title</label>
            <input type="text" name="title" class="form-input" placeholder="e.g. Margalla Trail Plantation Drive" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Field Location / Sector</label>
            <input type="text" name="site_name" class="form-input" placeholder="Margalla Trail 3 Entrance" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Activity Type</label>
            <select name="activity_type" class="form-select">
              <option value="Tree Plantation">Tree Plantation</option>
              <option value="Seed Bombing">Seed Bombing</option>
              <option value="Monitoring Visit">Monitoring Visit</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Event Date</label>
            <input type="date" name="date" class="form-input" required/>
          </div>
          <button type="submit" class="btn btn-dark" style="width:100%;">Create Community Drive</button>
        </form>
      </div>

      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Upcoming Drives ({{ count($communityTasks) }})</div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @foreach($communityTasks as $t)
              <tr>
                <td><b>{{ $t->title }}</b></td>
                <td>{{ $t->location->name ?? 'Site' }}</td>
                <td>{{ $t->date }}</td>
                <td><span class="badge role-volunteer">{{ ucfirst($t->status) }}</span></td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Panel 8: Goals & Broadcast -->
  <div id="panelGoals" class="panel-section" style="display:none;">
    <div class="split-grid">
      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Monthly Community Targets</div>
        <form method="POST" action="/admin/goals">
          @csrf
          <div class="form-group">
            <label class="form-label">Target Trees Planted</label>
            <input type="number" name="target_trees" class="form-input" value="{{ $goal->target_trees ?? 100000 }}" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Target Seeds Dispersed</label>
            <input type="number" name="target_seeds" class="form-input" value="{{ $goal->target_seeds ?? 50000 }}" required/>
          </div>
          <button type="submit" class="btn btn-dark" style="width:100%;">Update Monthly Targets</button>
        </form>
      </div>

      <div class="panel-card" style="margin:0;">
        <div class="panel-h2">Broadcast Notification</div>
        <form method="POST" action="/admin/broadcast">
          @csrf
          <div class="form-group">
            <label class="form-label">Announcement Title</label>
            <input type="text" name="title" class="form-input" placeholder="e.g. Margalla Drive This Sunday" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Message Details</label>
            <textarea name="message" class="form-input" style="height:80px;padding:10px;" placeholder="Message to send..." required></textarea>
          </div>
          <button type="submit" class="btn btn-dark" style="width:100%;">Dispatch Broadcast Notification</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Panel 9: Threat & Bug Reports -->
  <div id="panelReports" class="panel-section" style="display:none;">
    <div class="panel-card">
      <div class="panel-h2">Threat Reports &amp; User Bug Queue ({{ count($reports) }})</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          @foreach($reports as $r)
            <tr>
              <td><b>{{ $r->category }}</b></td>
              <td>{{ $r->location_name }}</td>
              <td>{{ $r->severity }}</td>
              <td>{{ $r->description }}</td>
              <td><span class="badge">{{ ucfirst($r->status) }}</span></td>
              <td>
                @if($r->status !== 'resolved')
                  <form method="POST" action="/admin/reports/{{ $r->id }}/resolve">
                    @csrf
                    <input type="hidden" name="status" value="resolved"/>
                    <button type="submit" class="btn btn-dark" style="padding:4px 8px;font-size:10px;">Resolve</button>
                  </form>
                @else
                  <span style="font-size:11px;color:var(--text-muted);">Resolved</span>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>

  <!-- Panel: Interest Analytics -->
  <div id="panelAnalytics" class="panel-section" style="display:none;">
    <div class="section-card" style="margin-bottom:20px;">
      <h2 class="section-title">User Interest Distribution</h2>
      <p style="color:var(--text-2);font-size:13px;margin-bottom:20px;">How users are distributed across ecological interest categories. Powered by live <code>user_interests</code> pivot data.</p>

      <!-- Summary Strip -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
        <div style="background:rgba(200,255,85,0.1);border:1px solid rgba(200,255,85,0.25);border-radius:12px;padding:18px;">
          <div style="font-size:24px;font-weight:900;color:var(--lime);">{{ $interestStats->count() }}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:4px;">Total Interest Tags</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;">
          <div style="font-size:24px;font-weight:900;color:#fff;">{{ $interestStats->sum('count') }}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:4px;">Total Interest Assignments</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px;">
          <div style="font-size:24px;font-weight:900;color:#f6a623;">{{ $usersWithoutInterests }}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:4px;">Users With No Interests Set</div>
        </div>
      </div>

      @if($topInterest)
      <div style="background:rgba(200,255,85,0.07);border:1px solid rgba(200,255,85,0.18);border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
        <span class="material-icons-round" style="color:var(--lime);font-size:22px;">emoji_events</span>
        <div>
          <div style="font-weight:800;color:var(--lime);font-size:13px;">Top Interest: {{ $topInterest['name'] }}</div>
          <div style="font-size:11px;color:var(--text-2);">{{ $topInterest['count'] }} users are interested in this ecological area</div>
        </div>
      </div>
      @endif

      <!-- Distribution Bars -->
      @php
        $maxCount = $interestStats->max('count') ?: 1;
        $colors = ['#C8FF55','#5BF0AA','#5BC8FF','#FF8A5B','#C85BFF','#FFD85B','#FF5B8A','#5BFFD8'];
      @endphp

      <div style="display:flex;flex-direction:column;gap:14px;">
        @foreach($interestStats as $index => $stat)
          @php
            $pct = ($stat['count'] / $maxCount) * 100;
            $color = $colors[$index % count($colors)];
          @endphp
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:700;color:#fff;">{{ $stat['name'] }}</span>
              <span style="font-size:12px;font-weight:800;color:{{ $color }};">{{ $stat['count'] }} users</span>
            </div>
            <div style="background:rgba(255,255,255,0.07);border-radius:99px;height:10px;overflow:hidden;">
              <div style="width:{{ $pct }}%;height:100%;border-radius:99px;background:{{ $color }};transition:width 0.6s ease;"></div>
            </div>
          </div>
        @endforeach

        @if($interestStats->isEmpty())
          <div style="text-align:center;padding:40px;color:var(--text-muted);">No interest data yet — users haven't selected interests.</div>
        @endif
      </div>
    </div>

    <!-- Raw Table -->
    <div class="section-card">
      <h2 class="section-title">Raw Interest Table</h2>
      <table class="data-table">
        <thead><tr><th>#</th><th>Interest Name</th><th>User Count</th><th>Share of Users</th></tr></thead>
        <tbody>
          @php $grandTotal = $totalUsers ?: 1; @endphp
          @forelse($interestStats as $i => $stat)
            <tr>
              <td style="color:var(--text-muted);">{{ $i + 1 }}</td>
              <td style="font-weight:700;color:#fff;">{{ $stat['name'] }}</td>
              <td><span style="background:rgba(200,255,85,0.12);color:var(--lime);padding:3px 10px;border-radius:99px;font-size:12px;font-weight:800;">{{ $stat['count'] }}</span></td>
              <td style="color:var(--text-2);font-size:12px;">{{ $grandTotal > 0 ? round(($stat['count'] / $grandTotal) * 100, 1) : 0 }}% of users</td>
            </tr>
          @empty
            <tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">No interests found in database.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

</main>

<script>
  function showPanel(panelKey) {
    document.querySelectorAll('.panel-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    var targetId = 'panel' + panelKey.charAt(0).toUpperCase() + panelKey.slice(1);
    var targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.style.display = 'block';

    var headings = {
      'overview': 'Enterprise Admin Dashboard',
      'users': 'User Management & Role Permissions (CRUD)',
      'verification': 'Activity Submission Moderation Queue',
      'aqi': 'Air Quality Index & Sensor Override',
      '2fa': 'Google Authenticator 2FA Setup Key',
      'smtp': 'Dual-SMTP Mailer Settings & HTML Email Dispatcher',
      'species': 'Species Catalogue Management',
      'drives': 'Community Restoration Drives Manager',
      'goals': 'Monthly Targets & Broadcast Notifications',
      'reports': 'Threat & Bug Reports Moderation Queue',
      'analytics': 'Interest Analytics & User Distribution'
    };

    document.getElementById('panelHeading').innerText = headings[panelKey] || 'Admin Dashboard';
    event.currentTarget.classList.add('active');
  }
</script>

</body>
</html>
