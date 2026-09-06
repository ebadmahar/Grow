<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.monitoring_reminders' => ['sometimes', 'boolean'],
            'settings.goal_progress' => ['sometimes', 'boolean'],
            'settings.community_tasks' => ['sometimes', 'boolean'],
            'settings.verification_updates' => ['sometimes', 'boolean'],
            'settings.offline_mode' => ['sometimes', 'boolean'],
            'settings.high_accuracy_gps' => ['sometimes', 'boolean'],
            'settings.language' => ['sometimes', 'string'],
        ];
    }
}
