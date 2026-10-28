<?php

namespace App\Http\Requests;

use App\Enums\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInternshipApplicationStatusRequest extends FormRequest
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
            'status' => [
                'required',
                'string',
                Rule::in(ApplicationStatus::decisionValues()),
            ],
            'review_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
            // Metadata keputusan dan identitas tidak boleh dipasok klien.
            'user_id' => ['prohibited'],
            'partner_id' => ['prohibited'],
            'submitted_at' => ['prohibited'],
            'reviewed_at' => ['prohibited'],
            'reviewed_by' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Keputusan pengajuan wajib dipilih.',
            'status.in' => 'Keputusan hanya dapat berupa Diterima atau Ditolak.',
            'review_note.max' => 'Catatan review maksimal 5000 karakter.',
            'user_id.prohibited' => 'user_id tidak boleh diubah melalui endpoint ini.',
            'partner_id.prohibited' => 'Mitra pengajuan tidak boleh diubah melalui endpoint keputusan.',
            'submitted_at.prohibited' => 'Waktu pengajuan tidak boleh diubah klien.',
            'reviewed_at.prohibited' => 'Waktu review ditetapkan oleh server.',
            'reviewed_by.prohibited' => 'Reviewer ditetapkan dari akun Admin/Prodi yang sedang login.',
        ];
    }
}
