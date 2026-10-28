<?php

namespace App\Services;

use App\Models\AcceptanceLetter;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AcceptanceLetterService
{
    /**
     * Store the file outside the public disk with a generated name, then
     * persist its metadata. If the database write fails, the newly stored
     * file is removed so no unreferenced file is left behind.
     */
    public function store(
        InternshipApplication $application,
        User $uploader,
        UploadedFile $file,
    ): AcceptanceLetter {
        $disk = (string) config('internship.acceptance_letter.disk');
        $directory = trim(
            (string) config('internship.acceptance_letter.directory'),
            '/',
        ).'/'.$application->getKey();
        $extension = $file->extension()
            ?: $file->guessExtension()
            ?: 'bin';
        $path = $file->storeAs(
            $directory,
            Str::uuid()->toString().'.'.$extension,
            $disk,
        );

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('Surat penerimaan gagal disimpan.');
        }

        $existing = $application->acceptanceLetter()->first();
        $oldDisk = $existing?->disk;
        $oldPath = $existing?->path;

        try {
            $letter = DB::transaction(function () use (
                $application,
                $uploader,
                $file,
                $disk,
                $path,
                $existing,
            ): AcceptanceLetter {
                $attributes = [
                    'uploaded_by' => $uploader->getKey(),
                    'disk' => $disk,
                    'path' => $path,
                    'original_name' => $this->safeOriginalName(
                        $file->getClientOriginalName(),
                    ),
                    'mime_type' => $file->getMimeType()
                        ?: $file->getClientMimeType()
                        ?: 'application/octet-stream',
                    'size' => (int) $file->getSize(),
                ];

                if ($existing !== null) {
                    $existing->update($attributes);

                    return $existing->refresh();
                }

                return AcceptanceLetter::create([
                    ...$attributes,
                    'internship_application_id' => $application->getKey(),
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($path);

            throw $exception;
        }

        if ($oldDisk !== null && $oldPath !== null && $oldPath !== $path) {
            Storage::disk($oldDisk)->delete($oldPath);
        }

        return $letter;
    }

    public function exists(AcceptanceLetter $letter): bool
    {
        return Storage::disk($letter->disk)->exists($letter->path);
    }

    public function fileResponse(
        AcceptanceLetter $letter,
        bool $download = false,
    ): StreamedResponse {
        return Storage::disk($letter->disk)->response(
            $letter->path,
            $letter->original_name,
            [
                'Content-Type' => $letter->mime_type,
                'X-Content-Type-Options' => 'nosniff',
            ],
            $download ? 'attachment' : 'inline',
        );
    }

    /**
     * Keep the display filename, but never use it as a storage path. Remove
     * client-supplied directories and control characters.
     */
    private function safeOriginalName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? $name;
        $name = trim($name);

        if ($name === '') {
            $name = 'surat-penerimaan';
        }

        return mb_substr($name, 0, 255);
    }
}
