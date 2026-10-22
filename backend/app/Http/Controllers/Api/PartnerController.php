<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartnerRequest;
use App\Http\Requests\UpdatePartnerRequest;
use App\Models\Partner;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        $partners = Partner::query()
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Daftar mitra magang.',
            'data' => $partners->items(),
            'meta' => [
                'current_page' => $partners->currentPage(),
                'per_page' => $partners->perPage(),
                'last_page' => $partners->lastPage(),
                'total' => $partners->total(),
            ],
        ]);
    }

    public function store(StorePartnerRequest $request): JsonResponse
    {
        $partner = Partner::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Mitra magang berhasil dibuat.',
            'data' => $partner,
        ], 201);
    }

    public function show(Partner $partner): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $partner,
        ]);
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): JsonResponse
    {
        $partner->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Mitra magang berhasil diperbarui.',
            'data' => $partner->fresh(),
        ]);
    }

    public function destroy(Partner $partner): JsonResponse
    {
        if ($partner->internshipApplications()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Mitra magang tidak dapat dihapus karena masih memiliki pengajuan mahasiswa.',
            ], 409);
        }

        try {
            $partner->delete();
        } catch (QueryException) {
            return response()->json([
                'success' => false,
                'message' => 'Mitra magang tidak dapat dihapus karena masih dipakai data lain.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mitra magang berhasil dihapus.',
        ]);
    }

    /**
     * Daftar mitra untuk pemilihan di form penilaian kriteria.
     * Read-only agar role yang mengelola kriteria tidak perlu akses CRUD mitra.
     */
    public function options(): JsonResponse
    {
        $partners = Partner::query()
            ->orderBy('name')
            ->orderBy('id')
            ->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'message' => 'Daftar mitra untuk pemilihan.',
            'data' => $partners,
        ]);
    }
}
