<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSystemSettingRequest;
use App\Http\Requests\UpdateSystemSettingRequest;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $group = $request->query('group');

        $query = SystemSetting::query()->orderBy('group')->orderBy('key');

        if ($group !== null && $group !== '') {
            $query->where('group', $group);
        }

        $settings = $query->get()->map(function ($setting) {
            return [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => SystemSetting::get($setting->key),
                'group' => $setting->group,
                'description' => $setting->description,
                'created_at' => $setting->created_at,
                'updated_at' => $setting->updated_at,
                'created_by' => $setting->created_by,
                'updated_by' => $setting->updated_by,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengaturan sistem.',
            'data' => $settings,
        ]);
    }

    public function store(StoreSystemSettingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $setting = SystemSetting::set(
            $validated['key'],
            $validated['value'],
            $validated['group'] ?? null,
            $validated['description'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem berhasil disimpan.',
            'data' => $setting,
        ], 201);
    }

    public function show(SystemSetting $setting): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Detail pengaturan sistem.',
            'data' => $setting,
        ]);
    }

    public function update(
        UpdateSystemSettingRequest $request,
        SystemSetting $setting
    ): JsonResponse {
        $validated = $request->validated();

        SystemSetting::set(
            $setting->key,
            $validated['value'],
            $validated['group'] ?? $setting->group,
            $validated['description'] ?? $setting->description
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem berhasil diperbarui.',
            'data' => $setting->fresh(),
        ]);
    }

    public function destroy(SystemSetting $setting): JsonResponse
    {
        $key = $setting->key;

        $setting->delete();

        \Illuminate\Support\Facades\Cache::forget('system_setting.' . $key);

        return response()->json([
            'success' => true,
            'message' => "Pengaturan sistem {$key} berhasil dihapus.",
        ]);
    }

    /**
     * Get settings grouped by category for the admin configuration page.
     */
    public function byGroup(): JsonResponse
    {
        $groups = SystemSetting::query()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group');

        $data = [];

        foreach ($groups as $group) {
            $data[$group] = SystemSetting::group($group)->map(function ($setting) {
                return [
                    'key' => $setting->key,
                    'value' => SystemSetting::get($setting->key),
                    'description' => $setting->description,
                ];
            })->all();
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem per grup.',
            'data' => $data,
        ]);
    }
}
