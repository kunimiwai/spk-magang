<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get a setting value by key, with optional default.
     *
     * @param  string  $key
     * @param  mixed  $default
     * @return mixed
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        // Gunakan query langsung ke database untuk menghindari
        // autoloader/cache issue di konteks tinker.
        $setting = self::query()->where('key', $key)->first();

        if ($setting === null) {
            return $default;
        }

        $value = $setting->value;

        // Nilai yang disimpan sebagai JSON (array, objek, boolean, angka)
        // dikembalikan ke tipe asli sehingga pemanggil seperti
        // RecommendationService dan AcademicPrerequisiteEvaluator membaca
        // feature_criterion_ids, peminatan_cluster_map, dan aturan prasyarat
        // dengan tipe data yang sesuai, bukan sebagai string mentah.
        if (is_string($value)) {
            // Pertama, coba decode JSON standar
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }

            // Jika JSON gagal, coba parse format PHP array:
            // db menyimpan seperti: ["course_id":7,"minimum_score":70]
            // (pakai ":" bukan "=>", bukan JSON valid tapi umum digunakan di seeding)
            $phpDecoded = self::parsePhpArrayFormat($value);

            if (is_array($phpDecoded)) {
                return $phpDecoded;
            }

            // Jika keduanya gagal, kembalikan nilai mentah
            return $value;
        }

        return $value;
    }

    /**
     * Set a setting value by key.
     *
     * @param  string  $key
     * @param  mixed  $value
     * @param  string|null  $group
     * @param  string|null  $description
     * @return self
     */
    public static function set(
        string $key,
        mixed $value,
        ?string $group = null,
        ?string $description = null
    ): self {
        $setting = self::query()->where('key', $key)->first();

        if ($setting === null) {
            $setting = new self();
            $setting->key = $key;
            $setting->group = $group;
            $setting->description = $description;
        }

        $setting->value = is_string($value) ? $value : json_encode($value);
        $setting->save();

        return $setting;
    }

    /**
     * Get all settings for a group.
     *
     * @param  string  $group
     * @return \Illuminate\Database\Eloquent\Collection<int, self>
     */
    public static function group(string $group): \Illuminate\Database\Eloquent\Collection
    {
        return self::query()
            ->where('group', $group)
            ->orderBy('key')
            ->get();
    }

    /**
     * Parse PHP array format dari string seperti:
     * ["course_id":7,"minimum_score":70]
     * Menjadi: ["course_id" => 7, "minimum_score" => 70]
     */
    protected static function parsePhpArrayFormat(string $string): ?array
    {
        // Hilangkan bracket luar jika ada
        $string = trim($string);
        if (strlen($string) < 2) {
            return null;
        }
        // Cek apakah string mulai dengan [ dan akhir dengan ]
        if ($string[0] === '[') {
            $closing = $string[\strlen($string) - 1];
            if ($closing === ']') {
                $innerLen = strlen($string) - 2;
                $string = substr($string, 1, $innerLen);
            }
        }

        // Ekstrak pasangan key:value menggunakan regex
        // Format: "key":value dengan pemisah koma
        preg_match_all('/"([^"]+)"\s*:\s*([^,\]]+)/', $string, $matches, PREG_SET_ORDER);

        $result = [];
        foreach ($matches as $match) {
            $key = $match[1];
            $value = trim($match[2]);

            // Konversi ke tipe numeric jika possible
            if (preg_match('/^\d+$/', $value)) {
                $value = (int) $value;
            } elseif (preg_match('/^\d+\.\d+$/', $value)) {
                $value = (float) $value;
            }

            $result[$key] = $value;
        }

        // Hanya kembalikan jika ada pasangan key-value yang berhasil diekstrak
        return ! empty($result) ? $result : null;
    }
}