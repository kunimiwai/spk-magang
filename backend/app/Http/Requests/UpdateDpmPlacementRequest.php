<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDpmPlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            // Only existing user accounts with role "dpm" are eligible. There
            // is no lecturer master table yet, so using the real role avoids
            // treating arbitrary users as lecturers.
            'dpm_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where('role', 'dpm'),
            ],
            'internship_application_id' => ['prohibited'],
            'user_id' => ['prohibited'],
            'status' => ['prohibited'],
            'assigned_by' => ['prohibited'],
            'assigned_at' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dpm_id.required' => 'Dosen pembimbing magang wajib dipilih.',
            'dpm_id.integer' => 'Dosen pembimbing magang tidak valid.',
            'dpm_id.exists' => 'Akun yang dipilih bukan pengguna dengan role DPM.',
            'internship_application_id.prohibited' => 'Pengajuan ditentukan dari URL, bukan dari body.',
            'user_id.prohibited' => 'Identitas mahasiswa tidak boleh diubah melalui endpoint ini.',
            'status.prohibited' => 'Status pengajuan tidak boleh diubah melalui endpoint penempatan.',
            'assigned_by.prohibited' => 'Penetap DPM berasal dari akun yang sedang login.',
            'assigned_at.prohibited' => 'Waktu penetapan ditetapkan oleh server.',
        ];
    }
}
