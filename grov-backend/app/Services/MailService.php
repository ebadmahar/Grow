<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;

class MailService
{
    /**
     * Get current dual-SMTP settings from persistent Cache/storage
     */
    public static function getSmtpSettings(): array
    {
        return Cache::get('smtp_settings', [
            'noreply' => [
                'host' => config('mail.mailers.noreply.host', '127.0.0.1'),
                'port' => (int) config('mail.mailers.noreply.port', 2525),
                'encryption' => config('mail.mailers.noreply.encryption', 'tls'),
                'username' => config('mail.mailers.noreply.username', 'noreply@growgrov.org'),
                'password' => config('mail.mailers.noreply.password', ''),
                'from_address' => config('mail.mailers.noreply.from.address', 'noreply@growgrov.org'),
                'from_name' => config('mail.mailers.noreply.from.name', 'Grōv Community & Field Updates'),
            ],
            'security' => [
                'host' => config('mail.mailers.security.host', '127.0.0.1'),
                'port' => (int) config('mail.mailers.security.port', 2525),
                'encryption' => config('mail.mailers.security.encryption', 'tls'),
                'username' => config('mail.mailers.security.username', 'security@growgrov.org'),
                'password' => config('mail.mailers.security.password', ''),
                'from_address' => config('mail.mailers.security.from.address', 'security@growgrov.org'),
                'from_name' => config('mail.mailers.security.from.name', 'Grōv Account Security'),
            ],
        ]);
    }

    /**
     * Save dynamic dual-SMTP settings
     */
    public static function saveSmtpSettings(array $settings): void
    {
        $current = self::getSmtpSettings();
        $merged = [
            'noreply' => array_merge($current['noreply'], $settings['noreply'] ?? []),
            'security' => array_merge($current['security'], $settings['security'] ?? []),
        ];
        Cache::put('smtp_settings', $merged, 86400 * 365);
        self::applyDynamicConfig();
    }

    /**
     * Dynamically register mailer credentials into Laravel runtime Config
     */
    public static function applyDynamicConfig(): void
    {
        $settings = self::getSmtpSettings();

        foreach (['noreply', 'security'] as $mailerKey) {
            $conf = $settings[$mailerKey];
            Config::set("mail.mailers.{$mailerKey}", [
                'transport' => 'smtp',
                'host' => $conf['host'],
                'port' => (int) $conf['port'],
                'encryption' => $conf['encryption'] === 'none' ? null : $conf['encryption'],
                'username' => $conf['username'],
                'password' => $conf['password'],
                'from' => [
                    'address' => $conf['from_address'],
                    'name' => $conf['from_name'],
                ],
            ]);
        }
    }

    /**
     * Send HTML Notification Email using noreply@growgrov.org mailer
     */
    public static function sendNotificationEmail(
        string $to,
        string $subject,
        string $title,
        string $bodyHtml,
        ?string $actionUrl = null,
        ?string $actionText = null
    ): bool {
        try {
            self::applyDynamicConfig();
            $settings = self::getSmtpSettings()['noreply'];

            Mail::mailer('noreply')->send('emails.notification', [
                'subject' => $subject,
                'title' => $title,
                'bodyHtml' => $bodyHtml,
                'actionUrl' => $actionUrl,
                'actionText' => $actionText,
            ], function ($message) use ($to, $subject, $settings) {
                $message->to($to)
                    ->from($settings['from_address'], $settings['from_name'])
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed sending notification email via noreply: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send HTML Security Email using security@growgrov.org mailer
     */
    public static function sendSecurityEmail(
        string $to,
        string $subject,
        string $title,
        string $bodyHtml,
        ?string $actionUrl = null,
        ?string $actionText = null
    ): bool {
        try {
            self::applyDynamicConfig();
            $settings = self::getSmtpSettings()['security'];

            Mail::mailer('security')->send('emails.security', [
                'subject' => $subject,
                'title' => $title,
                'bodyHtml' => $bodyHtml,
                'actionUrl' => $actionUrl,
                'actionText' => $actionText,
            ], function ($message) use ($to, $subject, $settings) {
                $message->to($to)
                    ->from($settings['from_address'], $settings['from_name'])
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed sending security email via security: ' . $e->getMessage());
            return false;
        }
    }
}
