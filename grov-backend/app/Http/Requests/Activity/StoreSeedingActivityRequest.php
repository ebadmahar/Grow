<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;

class StoreSeedingActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'species_id' => ['required', 'integer', 'exists:species,id'],
            'seeds_dispersed' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'site_name' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'dispersal_method' => ['required', 'in:Hand Broadcasting,Seed Bombing (aerial),Seed Drill,Hydroseeding'],
            'coverage_area_sqm' => ['nullable', 'integer', 'min:1'],
            'field_notes' => ['nullable', 'string'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['file', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ];
    }
}
