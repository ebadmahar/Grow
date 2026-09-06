<?php

namespace App\Http\Requests\Monitoring;

use Illuminate\Foundation\Http\FormRequest;

class StoreMonitoringRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_id' => ['required', 'integer', 'exists:activities,id'],
            'observation_date' => ['required', 'date'],
            'observed_count' => ['required', 'integer', 'min:0'],
            'established_count' => ['required', 'integer', 'min:0', 'lte:observed_count'],
            'surviving_count' => ['required', 'integer', 'min:0', 'lte:observed_count'],
            'dead_count' => ['required', 'integer', 'min:0', 'lte:observed_count'],
            'condition' => ['required', 'in:Good,Fair,Poor,Unknown'],
            'notes' => ['nullable', 'string'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['file', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ];
    }

    public function messages(): array
    {
        return [
            'established_count.lte' => 'Established count cannot exceed the total observed count.',
            'surviving_count.lte' => 'Surviving count cannot exceed the total observed count.',
            'dead_count.lte' => 'Dead count cannot exceed the total observed count.',
        ];
    }
}
