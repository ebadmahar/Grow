<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_id' => ['nullable', 'integer', 'exists:activities,id'],
            'site_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:Pest / Disease,Fire Risk,Illegal Dumping,Illegal Cutting,Flooding / Erosion,Other'],
            'severity' => ['required', 'in:Low,Medium,High'],
            'description' => ['required', 'string'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['file', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ];
    }
}
