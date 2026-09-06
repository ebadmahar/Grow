<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{ $subject ?? 'Grōv Community Update' }}</title>
  <style>
    body { margin:0; padding:0; background-color:#0F1512; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E4EBE4; }
    .container { max-width:600px; margin:0 auto; padding:30px 20px; }
    .header { text-align:center; padding-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.1); }
    .logo-mark { font-size:28px; font-weight:800; color:#C8FF55; letter-spacing:-1px; text-decoration:none; }
    .badge { display:inline-block; background:rgba(200,255,85,0.15); color:#C8FF55; border:1px solid rgba(200,255,85,0.3); padding:4px 12px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:8px; }
    .card { background:#161E1A; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:30px; margin-top:24px; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
    .h1 { font-size:22px; font-weight:800; color:#FFFFFF; margin:0 0 16px 0; line-height:1.3; }
    .body-text { font-size:15px; color:#A3B8A1; line-height:1.6; margin:0 0 24px 0; }
    .btn { display:inline-block; background:#C8FF55; color:#0F1512; font-weight:800; font-size:14px; text-decoration:none; padding:14px 28px; border-radius:8px; text-align:center; }
    .footer { text-align:center; font-size:12px; color:#5D745C; margin-top:32px; line-height:1.5; }
    .footer a { color:#8A9F88; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-mark">GRŌV</div>
      <div class="badge">Community & Field Update</div>
    </div>

    <div class="card">
      <h1 class="h1">{{ $title ?? 'Latest Field Restoration News' }}</h1>
      <div class="body-text">
        {!! $bodyHtml ?? 'Thank you for being an active part of the Islamabad Ecological Restoration Campaign!' !!}
      </div>

      @if(!empty($actionUrl) && !empty($actionText))
        <div style="text-align:center; margin-top:28px;">
          <a href="{{ $actionUrl }}" class="btn">{{ $actionText }}</a>
        </div>
      @endif
    </div>

    <div class="footer">
      Sent by <b>Grōv Platform Notifications</b> (noreply@growgrov.org)<br>
      Margalla Hills Ecological Restoration Drive • Islamabad, Pakistan<br>
      If you did not subscribe, you can update your notification settings in your profile.
    </div>
  </div>
</body>
</html>
