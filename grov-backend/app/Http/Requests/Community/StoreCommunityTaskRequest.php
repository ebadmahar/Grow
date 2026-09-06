<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'activity_type' => ['required', 'in:Tree Plantation,Seed Bombing,Monitoring Visit,Site Survey,Mixed Activities'],
            'site_name' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i,H:i:s'],
            'max_volunteers' => ['nullable', 'integer', 'min:1'],
            'description' => ['required', 'string'],
            'cover_image' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ];
    }
}
