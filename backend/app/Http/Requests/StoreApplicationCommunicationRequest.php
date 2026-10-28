<?php

namespace App\Http\Requests;

use App\Enums\CommunicationChannel;
use App\Enums\CommunicationDirection;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Throwable;

class StoreApplicationCommunicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize an offset-bearing timestamp to UTC before validation and
     * persistence. Without this step, Eloquent drops the offset and stores the
     * wall-clock part as if it were UTC.
     */
    protected function prepareForValidation(): void
    {
        $occurredAt = $this->input('occurred_at');

        if (! is_string($occurredAt) || trim($occurredAt) === '') {
            return;
        }

        try {
            $this->merge([
                'occurred_at' => CarbonImmutable::parse($occurredAt)
                    ->utc()
                    ->toIso8601String(),
            ]);
        } catch (Throwable) {
            // The date rule reports the validation error.
        }
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'direction' => [
                'required',
                'string',
                Rule::enum(CommunicationDirection::class),
            ],
            'channel' => [
                'required',
                'string',
                Rule::enum(CommunicationChannel::class),
            ],
            'occurred_at' => ['required', 'date'],
            'summary' => ['required', 'string', 'max:2000'],
            // Metadata dan identitas ditetapkan server.
            'internship_application_id' => ['prohibited'],
            'recorded_by' => ['prohibited'],
            'created_at' => ['prohibited'],
            'updated_at' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'direction.required' => 'Arah komunikasi wajib dipilih.',
            'direction.enum' => 'Arah komunikasi harus pengiriman atau balasan.',
            'channel.required' => 'Kanal komunikasi wajib dipilih.',
            'channel.enum' => 'Kanal komunikasi hanya dapat berupa email atau surat.',
            'occurred_at.required' => 'Waktu komunikasi wajib diisi.',
            'occurred_at.date' => 'Waktu komunikasi tidak valid.',
            'summary.required' => 'Ringkasan komunikasi wajib diisi.',
            'summary.max' => 'Ringkasan komunikasi maksimal 2000 karakter.',
            'internship_application_id.prohibited' => 'Pengajuan ditentukan dari URL, bukan dari body.',
            'recorded_by.prohibited' => 'Pencatat ditetapkan dari akun yang sedang login.',
            'created_at.prohibited' => 'Waktu pencatatan ditetapkan oleh server.',
            'updated_at.prohibited' => 'Waktu pembaruan ditetapkan oleh server.',
        ];
    }
}
