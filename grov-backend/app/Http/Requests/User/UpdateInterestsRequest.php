<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInterestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'interest_ids' => ['required', 'array'],
            'interest_ids.*' => ['integer', 'exists:interests,id'],
        ];
    }
}
