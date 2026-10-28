<?php

namespace App\Http\Requests;

use App\Support\AcceptanceLetterRules;
use App\Support\UploadLimit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreAcceptanceLetterRequest extends FormRequest
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
        $maxSizeKb = UploadLimit::acceptanceLetterMaxKb();
        $allowedMimeTypes = AcceptanceLetterRules::allowedMimeTypes();

        return [
            'file' => [
                'required',
                'file',
                File::types($allowedMimeTypes)->max($maxSizeKb),
            ],
            // Server-owned metadata. The file, owner, and path are derived
            // from the authenticated request and storage configuration.
            'internship_application_id' => ['prohibited'],
            'user_id' => ['prohibited'],
            'uploaded_by' => ['prohibited'],
            'disk' => ['prohibited'],
            'path' => ['prohibited'],
            'original_name' => ['prohibited'],
            'mime_type' => ['prohibited'],
            'size' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxSizeKb = UploadLimit::acceptanceLetterMaxKb();

        return [
            'file.required' => 'Surat penerimaan wajib dipilih.',
            'file.file' => 'Berkas surat penerimaan tidak valid.',
            'file.uploaded' => "Surat penerimaan gagal diunggah. Pastikan ukuran tidak melebihi batas server ({$maxSizeKb} KB).",
            'file.max' => "Ukuran surat penerimaan maksimal {$maxSizeKb} KB.",
            'file.mimetypes' => 'Format surat penerimaan harus PDF, JPG, atau PNG.',
            'internship_application_id.prohibited' => 'Pengajuan ditentukan dari URL, bukan dari body.',
            'user_id.prohibited' => 'Identitas pengunggah mengikuti akun yang sedang login.',
            'uploaded_by.prohibited' => 'Pengunggah ditetapkan dari akun yang sedang login.',
            'disk.prohibited' => 'Lokasi penyimpanan ditetapkan oleh server.',
            'path.prohibited' => 'Path berkas ditetapkan oleh server.',
            'original_name.prohibited' => 'Nama berkas asli dibaca dari unggahan.',
            'mime_type.prohibited' => 'Tipe berkas ditentukan dari hasil validasi server.',
            'size.prohibited' => 'Ukuran berkas dibaca dari unggahan.',
        ];
    }
}
