<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user()->id)],
            'location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'role' => ['sometimes', 'required', 'in:volunteer,coordinator'],
        ];
    }
}
