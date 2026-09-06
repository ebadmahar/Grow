<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Grōv — PHP Admin Web Portal Login</title>
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
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #0F1512; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .login-card { width: 100%; max-width: 420px; background: #16201B; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .brand-mark { width: 52px; height: 52px; border-radius: 16px; background: var(--lime); color: var(--ink); display: grid; place-items: center; margin-bottom: 16px; font-weight: 800; font-size: 24px; }
    .h1 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .sub { font-size: 13px; color: #9DAF9A; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--lime); margin-bottom: 6px; display: block; }
    .input { width: 100%; height: 46px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3); padding: 0 14px; color: #fff; font-size: 14px; outline: none; }
    .input:focus { border-color: var(--lime); }
    .btn { width: 100%; height: 50px; border-radius: 10px; background: var(--lime); color: var(--ink); border: none; font-weight: 800; font-size: 14px; cursor: pointer; margin-top: 8px; }
    .alert-error { background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #FCA5A5; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
  </style>
</head>
<body>

<div class="login-card">
  <div class="brand-mark"><span class="material-icons-round">admin_panel_settings</span></div>
  <h1 class="h1">Web Admin Portal</h1>
  <p class="sub">PHP Native Portal · Grōv Restoration System</p>

  @if($errors->has('auth'))
    <div class="alert-error">{{ $errors->first('auth') }}</div>
  @endif

  @if(session('requires_2fa'))
    <div class="alert-error" style="background:rgba(200,255,85,0.15);border-color:var(--lime);color:var(--lime);">
      Google Authenticator 2FA required. Enter your 6-digit code below.
    </div>
  @endif

  <form method="POST" action="/admin/login">
    @csrf
    <div class="form-group">
      <label class="label">Admin Email</label>
      <input type="email" name="email" class="input" value="{{ old('email', session('email', 'admin@grov.app')) }}" required/>
    </div>

    <div class="form-group">
      <label class="label">Password</label>
      <input type="password" name="password" class="input" value="password" required/>
    </div>

    @if(session('requires_2fa') || old('totp_code'))
      <div class="form-group">
        <label class="label" style="color:var(--lime);">Google Authenticator (6-Digit OTP Code)</label>
        <input type="text" name="totp_code" class="input" placeholder="Enter 6-digit OTP" maxlength="6" style="border-color:var(--lime);background:rgba(200,255,85,0.1);" autofocus required/>
      </div>
    @endif

    <button type="submit" class="btn">
      {{ session('requires_2fa') ? 'Verify 2FA & Authenticate' : 'Sign In with 2FA' }}
    </button>
  </form>
</div>

</body>
</html>
