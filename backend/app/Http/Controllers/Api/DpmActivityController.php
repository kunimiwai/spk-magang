<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDpmActivityRequest;
use App\Models\DpmActivity;
use App\Models\DpmPlacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DpmActivityController extends Controller
{
    /**
     * Daftar aktivitas bimbingan DPM.
     *
     * DPM hanya melihat aktivitas miliknya. Admin/Prodi melihat semua.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DpmActivity::query()
            ->with(['placement.application.student', 'placement.application.partner', 'dpm'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if ($user->role === 'dpm') {
            $query->where('dpm_id', $user->getKey());
        }

        $activities = $query->paginate(15)->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat aktivitas bimbingan DPM.',
            'data' => $activities->items(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'per_page' => $activities->perPage(),
                'last_page' => $activities->lastPage(),
                'total' => $activities->total(),
            ],
        ]);
    }

    /**
     * Catat aktivitas bimbingan baru.
     *
     * Hanya DPM yang dapat mencatat aktivitas untuk penempatan miliknya.
     */
    public function store(
        StoreDpmActivityRequest $request,
        DpmPlacement $placement,
    ): JsonResponse {
        $user = $request->user();

        if ($user->role !== 'dpm') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya DPM yang dapat mencatat aktivitas bimbingan.',
            ], 403);
        }

        // Pastikan penempatan milik DPM yang login.
        if ($placement->dpm_id !== $user->getKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Penempatan tidak ditugaskan kepada Anda.',
            ], 403);
        }

        $validated = $request->validated();

        $activity = DpmActivity::create([
            'dpm_placement_id' => $placement->getKey(),
            'dpm_id' => $user->getKey(),
            'activity_type' => $validated['activity_type'],
            'description' => $validated['description'],
            'occurred_at' => $validated['occurred_at'],
        ]);

        $activity->load([
            'placement.application.student',
            'placement.application.partner',
            'dpm',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aktivitas bimbingan berhasil dicatat.',
            'data' => $activity,
        ], 201);
    }

    public function show(DpmActivity $activity, Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'dpm' && $activity->dpm_id !== $user->getKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Aktivitas tidak dapat diakses.',
            ], 403);
        }

        $activity->load([
            'placement.application.student',
            'placement.application.partner',
            'dpm',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail aktivitas bimbingan.',
            'data' => $activity,
        ]);
    }

    public function update(
        StoreDpmActivityRequest $request,
        DpmActivity $activity,
    ): JsonResponse {
        $user = $request->user();

        if ($user->role !== 'dpm' || $activity->dpm_id !== $user->getKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mengubah aktivitas ini.',
            ], 403);
        }

        $validated = $request->validated();

        $activity->update([
            'activity_type' => $validated['activity_type'],
            'description' => $validated['description'],
            'occurred_at' => $validated['occurred_at'],
        ]);

        $activity->load([
            'placement.application.student',
            'placement.application.partner',
            'dpm',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aktivitas bimbingan berhasil diperbarui.',
            'data' => $activity,
        ]);
    }

    public function destroy(DpmActivity $activity, Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'dpm' || $activity->dpm_id !== $user->getKey()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus aktivitas ini.',
            ], 403);
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Aktivitas bimbingan berhasil dihapus.',
        ]);
    }
}
