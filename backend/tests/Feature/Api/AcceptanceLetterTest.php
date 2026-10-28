<?php

namespace Tests\Feature\Api;

use App\Enums\ApplicationStatus;
use App\Models\AcceptanceLetter;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use App\Support\AcceptanceLetterRules;
use App\Support\UploadLimit;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AcceptanceLetterTest extends TestCase
{
    use RefreshDatabase;

    private const PDF_CONTENT = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";

    /**
     * @var list<string>
     */
    private array $temporaryFiles = [];

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    protected function tearDown(): void
    {
        foreach ($this->temporaryFiles as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }

        parent::tearDown();
    }

    public function test_mahasiswa_can_upload_an_acceptance_letter_for_an_accepted_application(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $file = UploadedFile::fake()->create(
            'surat-penerimaan.pdf',
            120,
            'application/pdf',
        );

        $response = $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                ['file' => $file],
            )
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'message',
                'Surat penerimaan berhasil diunggah.',
            )
            ->assertJsonPath(
                'data.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            )
            ->assertJsonPath(
                'data.acceptance_letter.mime_type',
                'application/pdf',
            );

        $letter = $application->fresh()->acceptanceLetter;

        $this->assertNotNull($letter);
        $this->assertSame($student->id, $letter->uploaded_by);
        $this->assertSame('local', $letter->disk);
        $this->assertStringStartsWith(
            "acceptance-letters/{$application->id}/",
            $letter->path,
        );
        $this->assertStringNotContainsString('surat-penerimaan', $letter->path);
        $this->assertGreaterThan(0, $letter->size);
        Storage::disk('local')->assertExists($letter->path);
        $this->assertArrayNotHasKey(
            'path',
            $response->json('data.acceptance_letter'),
        );
        $this->assertArrayNotHasKey(
            'disk',
            $response->json('data.acceptance_letter'),
        );

        $this->assertDatabaseHas('acceptance_letters', [
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
            'original_name' => 'surat-penerimaan.pdf',
            'mime_type' => 'application/pdf',
        ]);
    }

    public function test_upload_accepts_every_configured_mime_type(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);

        foreach ([
            ['name' => 'surat.pdf', 'mime' => 'application/pdf'],
            ['name' => 'surat.jpg', 'mime' => 'image/jpeg'],
            ['name' => 'surat.png', 'mime' => 'image/png'],
        ] as $case) {
            $application = $this->acceptedApplicationFor($student);

            $this->actingAs($student, 'sanctum')
                ->post(
                    "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                    [
                        'file' => UploadedFile::fake()->create(
                            $case['name'],
                            50,
                            $case['mime'],
                        ),
                    ],
                )
                ->assertCreated()
                ->assertJsonPath(
                    'data.acceptance_letter.mime_type',
                    $case['mime'],
                );
        }

        $this->assertDatabaseCount('acceptance_letters', 3);
    }

    public function test_upload_uses_the_configured_mime_allowlist(): void
    {
        config([
            'internship.acceptance_letter.allowed_mime_types' => ['image/png'],
        ]);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.pdf',
                        50,
                        'application/pdf',
                    ),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.png',
                        50,
                        'image/png',
                    ),
                ],
            )
            ->assertCreated();
    }

    public function test_empty_configured_allowlist_falls_back_to_safe_defaults(): void
    {
        config([
            'internship.acceptance_letter.allowed_mime_types' => [],
        ]);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/mahasiswa/acceptance-letter/limit')
            ->assertOk()
            ->assertJsonPath(
                'data.allowed_mime_types',
                AcceptanceLetterRules::DEFAULT_ALLOWED_MIME_TYPES,
            );

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.txt',
                        50,
                        'text/plain',
                    ),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.pdf',
                        50,
                        'application/pdf',
                    ),
                ],
            )
            ->assertCreated();
    }

    public function test_upload_detects_content_type_instead_of_trusting_the_filename_extension(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $file = $this->uploadedFileWithContent(
            'surat-penerimaan.jpg',
            self::PDF_CONTENT,
        );

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                ['file' => $file],
            )
            ->assertCreated()
            ->assertJsonPath(
                'data.acceptance_letter.original_name',
                'surat-penerimaan.jpg',
            )
            ->assertJsonPath(
                'data.acceptance_letter.mime_type',
                'application/pdf',
            );

        $letter = $application->fresh()->acceptanceLetter;

        $this->assertNotNull($letter);
        $this->assertStringEndsWith('.pdf', $letter->path);
        Storage::disk('local')->assertExists($letter->path);
    }

    public function test_upload_rejects_content_that_does_not_match_the_filename_extension(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $file = $this->uploadedFileWithContent(
            'surat-penerimaan.pdf',
            'Bukan berkas PDF.',
        );

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                ['file' => $file],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->assertDatabaseCount('acceptance_letters', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles());
    }

    public function test_upload_rejects_pdf_content_with_a_php_extension(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $file = $this->uploadedFileWithContent(
            'surat-penerimaan.php',
            self::PDF_CONTENT,
        );

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                ['file' => $file],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->assertDatabaseCount('acceptance_letters', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles());
    }

    public function test_letter_can_only_be_uploaded_for_an_accepted_application(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $reviewer = User::factory()->create(['role' => 'admin']);
        $file = UploadedFile::fake()->create(
            'surat-penerimaan.pdf',
            50,
            'application/pdf',
        );

        foreach ([ApplicationStatus::Menunggu, ApplicationStatus::Ditolak] as $status) {
            $application = InternshipApplication::factory()->create([
                'user_id' => $student->id,
                'partner_id' => Partner::factory(),
                'status' => $status,
                'reviewed_at' => $status === ApplicationStatus::Ditolak
                    ? now()
                    : null,
                'reviewed_by' => $status === ApplicationStatus::Ditolak
                    ? $reviewer->id
                    : null,
            ]);

            $this->actingAs($student, 'sanctum')
                ->post(
                    "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                    ['file' => $file],
                )
                ->assertStatus(409)
                ->assertJsonPath('success', false);
        }

        $this->assertDatabaseCount('acceptance_letters', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles());
    }

    public function test_upload_validates_file_type_and_size(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.txt',
                        10,
                        'text/plain',
                    ),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat-besar.pdf',
                        5121,
                        'application/pdf',
                    ),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->assertDatabaseCount('acceptance_letters', 0);
    }

    public function test_upload_size_message_uses_effective_limit(): void
    {
        config(['internship.acceptance_letter.max_size_kb' => 1]);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        $response = $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat-besar.pdf',
                        2,
                        'application/pdf',
                    ),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->assertStringContainsString(
            'maksimal 1 KB',
            (string) $response->json('errors.file.0'),
        );
        $this->assertDatabaseCount('acceptance_letters', 0);
    }

    public function test_effective_upload_limit_endpoint_reports_the_value_the_server_can_accept(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $configuredKb = (int) config('internship.acceptance_letter.max_size_kb');

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/mahasiswa/acceptance-letter/limit')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.max_size_kb', UploadLimit::acceptanceLetterMaxKb())
            ->assertJsonPath('data.configured_max_size_kb', $configuredKb)
            ->assertJsonPath('data.replaceable', false);

        $this->assertLessThanOrEqual(
            $configuredKb,
            $response->json('data.max_size_kb'),
        );
        $this->assertContains(
            'application/pdf',
            $response->json('data.allowed_mime_types'),
        );
    }

    public function test_upload_limit_endpoint_requires_mahasiswa_role(): void
    {
        $this->getJson('/api/mahasiswa/acceptance-letter/limit')
            ->assertUnauthorized();

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/acceptance-letter/limit')
                ->assertForbidden();
        }
    }

    public function test_client_cannot_override_document_metadata_or_owner(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $other = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $otherApplication = $this->acceptedApplicationFor($other);

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.pdf',
                        50,
                        'application/pdf',
                    ),
                    'internship_application_id' => $otherApplication->id,
                    'user_id' => $other->id,
                    'uploaded_by' => $other->id,
                    'disk' => 'public',
                    'path' => 'public/surat.pdf',
                    'original_name' => 'palsu.pdf',
                    'mime_type' => 'text/html',
                    'size' => 1,
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'internship_application_id',
                'user_id',
                'uploaded_by',
                'disk',
                'path',
                'original_name',
                'mime_type',
                'size',
            ]);

        $this->assertDatabaseCount('acceptance_letters', 0);
    }

    public function test_another_mahasiswa_cannot_upload_or_read_a_letter(): void
    {
        $owner = User::factory()->create(['role' => 'mahasiswa']);
        $other = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($owner);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $owner->id,
        ]);
        Storage::disk('local')->put($letter->path, 'PRIVATE');

        $this->actingAs($other, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'surat.pdf',
                        50,
                        'application/pdf',
                    ),
                ],
            )
            ->assertNotFound();

        $this->actingAs($other, 'sanctum')
            ->get(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
            )
            ->assertNotFound();

        $this->assertSame(1, AcceptanceLetter::query()->count());
        Storage::disk('local')->assertExists($letter->path);
    }

    public function test_owner_can_download_the_letter_through_an_authorized_request(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
            'original_name' => 'surat-penerimaan.pdf',
        ]);
        Storage::disk('local')->put($letter->path, 'PDF-CONTENT');

        $response = $this->actingAs($student, 'sanctum')
            ->get(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
            )
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('x-content-type-options', 'nosniff');

        $this->assertSame('PDF-CONTENT', $response->streamedContent());
        $this->assertStringContainsString(
            'inline',
            (string) $response->headers->get('content-disposition'),
        );

        $download = $this->actingAs($student, 'sanctum')
            ->get(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter?download=1",
            )
            ->assertOk();

        $this->assertStringContainsString(
            'attachment',
            (string) $download->headers->get('content-disposition'),
        );
        $this->assertSame('PDF-CONTENT', $download->streamedContent());
    }

    public function test_admin_and_prodi_can_download_any_letter_but_mahasiswa_and_dpm_cannot(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
        ]);
        Storage::disk('local')->put($letter->path, 'ADMIN-CONTENT');

        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);

            $response = $this->actingAs($reviewer, 'sanctum')
                ->get(
                    "/api/admin/applications/{$application->id}/acceptance-letter",
                )
                ->assertOk();

            $this->assertSame('ADMIN-CONTENT', $response->streamedContent());
        }

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->get(
                    "/api/admin/applications/{$application->id}/acceptance-letter",
                )
                ->assertForbidden();
        }

        $this->actingAs($student, 'sanctum')
            ->get(
                "/api/admin/applications/{$application->id}/acceptance-letter",
            )
            ->assertForbidden();
    }

    public function test_letter_endpoints_require_authentication_and_the_correct_role(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
        ]);
        Storage::disk('local')->put($letter->path, 'PRIVATE');

        $this->post(
            "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
            [
                'file' => UploadedFile::fake()->create(
                    'surat.pdf',
                    50,
                    'application/pdf',
                ),
            ],
        )->assertUnauthorized();

        $this->get(
            "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
        )->assertUnauthorized();

        $this->get(
            "/api/admin/applications/{$application->id}/acceptance-letter",
        )->assertUnauthorized();

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->post(
                    "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                    [
                        'file' => UploadedFile::fake()->create(
                            'surat.pdf',
                            50,
                            'application/pdf',
                        ),
                    ],
                )
                ->assertForbidden();
        }
    }

    public function test_existing_letter_cannot_be_replaced_until_policy_is_decided(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $existing = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
            'original_name' => 'lama.pdf',
        ]);
        Storage::disk('local')->put($existing->path, 'OLD');

        $this->actingAs($student, 'sanctum')
            ->post(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
                [
                    'file' => UploadedFile::fake()->create(
                        'baru.pdf',
                        50,
                        'application/pdf',
                    ),
                ],
            )
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertSame(1, AcceptanceLetter::query()->count());
        $this->assertSame('lama.pdf', $existing->fresh()->original_name);
        $this->assertSame('OLD', Storage::disk('local')->get($existing->path));
    }

    public function test_missing_letter_or_missing_stored_file_returns_not_found(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $withoutLetter = $this->acceptedApplicationFor($student);

        $this->actingAs($student, 'sanctum')
            ->get(
                "/api/mahasiswa/applications/{$withoutLetter->id}/acceptance-letter",
            )
            ->assertNotFound();

        $application = $this->acceptedApplicationFor($student);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
            'path' => 'acceptance-letters/missing.pdf',
        ]);

        $this->assertFalse(Storage::disk('local')->exists($letter->path));

        $this->actingAs($student, 'sanctum')
            ->get(
                "/api/mahasiswa/applications/{$application->id}/acceptance-letter",
            )
            ->assertNotFound();
    }

    public function test_deleting_the_application_removes_its_letter_record(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $letter = AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
        ]);

        $application->delete();

        $this->assertDatabaseMissing('acceptance_letters', [
            'id' => $letter->id,
        ]);
    }

    public function test_database_enforces_one_letter_per_application(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
        ]);

        $this->expectException(QueryException::class);

        AcceptanceLetter::factory()->create([
            'internship_application_id' => $application->id,
            'uploaded_by' => $student->id,
        ]);
    }

    private function uploadedFileWithContent(
        string $name,
        string $content,
    ): UploadedFile {
        $path = tempnam(sys_get_temp_dir(), 'spk-acceptance-letter-');

        if ($path === false) {
            $this->fail('Temporary file could not be created.');
        }

        file_put_contents($path, $content);
        $this->temporaryFiles[] = $path;

        return new UploadedFile($path, $name, null, null, true);
    }

    private function acceptedApplicationFor(
        User $student,
    ): InternshipApplication {
        $reviewer = User::factory()->create(['role' => 'admin']);

        return InternshipApplication::factory()->create([
            'user_id' => $student->id,
            'partner_id' => Partner::factory(),
            'status' => ApplicationStatus::Diterima,
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
    }
}
