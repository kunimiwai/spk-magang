<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInternshipApplicationRequest extends FormRequest
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
            'partner_id' => [
                'required',
                'integer',
                Rule::exists('partners', 'id'),
            ],
            // Semua field berikut dimiliki server. Menolaknya secara eksplisit
            // mencegah klien mengubah identitas, status awal, atau metadata
            // keputusan.
            'user_id' => ['prohibited'],
            'status' => ['prohibited'],
            'submitted_at' => ['prohibited'],
            'review_note' => ['prohibited'],
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
            'partner_id.required' => 'Mitra magang wajib dipilih.',
            'partner_id.integer' => 'Mitra magang tidak valid.',
            'partner_id.exists' => 'Mitra magang tidak ditemukan.',
            'user_id.prohibited' => 'user_id tidak boleh dikirim; identitas selalu mengikuti akun yang sedang login.',
            'status.prohibited' => 'Status awal ditetapkan oleh server dan tidak boleh dikirim klien.',
            'submitted_at.prohibited' => 'Waktu pengajuan ditetapkan oleh server.',
            'review_note.prohibited' => 'Catatan review hanya dapat diisi melalui keputusan Admin/Prodi.',
            'reviewed_at.prohibited' => 'Waktu review ditetapkan oleh server.',
            'reviewed_by.prohibited' => 'Reviewer ditetapkan dari akun Admin/Prodi yang sedang login.',
        ];
    }
}
