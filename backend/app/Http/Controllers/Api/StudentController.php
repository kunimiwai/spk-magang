<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StudentProfileService;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    /**
     * Peminatan labels are confirmed by the BPMN ("Pilih peminatan DTA / PSI / SIA").
     *
     * Cardinality and change rules remain undecided (OD-015). This reference
     * endpoint therefore reports whether persistence is currently enabled and
     * why it is disabled. The profile endpoints own the actual stored values.
     */
    public function peminatan(StudentProfileService $profiles): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Referensi peminatan mahasiswa.',
            'data' => [
                'options' => $profiles->options(),
                'selection_available' => $profiles->selectionAvailable(),
                'selection_mode' => $profiles->mode(),
                'note' => $profiles->note(),
            ],
        ]);
    }
}
