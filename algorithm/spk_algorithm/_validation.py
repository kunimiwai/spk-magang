from __future__ import annotations

import math
from collections.abc import Sequence as SequenceABC

from .errors import AlgorithmInputError


def as_finite_number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AlgorithmInputError(
            f"{label} harus berupa angka (int atau float), "
            f"bukan {type(value).__name__}."
        )

    number = float(value)

    if not math.isfinite(number):
        raise AlgorithmInputError(f"{label} harus berupa angka hingga (finite).")

    return number


def as_finite_non_negative_number(value: object, label: str) -> float:
    number = as_finite_number(value, label)

    if number < 0:
        raise AlgorithmInputError(f"{label} tidak boleh negatif.")

    return number


def validate_matrix(
    matrix: object,
    *,
    name: str = "matrix",
    non_negative: bool = False,
) -> list[list[float]]:
    if isinstance(matrix, (str, bytes, bytearray)) or not isinstance(
        matrix, SequenceABC
    ):
        raise AlgorithmInputError(f"{name} harus berupa urutan baris numerik.")

    if len(matrix) == 0:
        raise AlgorithmInputError(f"{name} tidak boleh kosong.")

    rows: list[list[float]] = []
    width: int | None = None

    for row_index, row in enumerate(matrix):
        if isinstance(row, (str, bytes, bytearray)) or not isinstance(
            row, SequenceABC
        ):
            raise AlgorithmInputError(
                f"{name}[{row_index}] harus berupa urutan angka."
            )

        if len(row) == 0:
            raise AlgorithmInputError(f"{name}[{row_index}] tidak boleh kosong.")

        if width is None:
            width = len(row)
        elif len(row) != width:
            raise AlgorithmInputError(
                f"Dimensi {name} tidak konsisten: baris 0 memiliki {width} "
                f"nilai, baris {row_index} memiliki {len(row)} nilai."
            )

        converted: list[float] = []

        for column_index, value in enumerate(row):
            label = f"{name}[{row_index}][{column_index}]"

            if non_negative:
                converted.append(as_finite_non_negative_number(value, label))
            else:
                converted.append(as_finite_number(value, label))

        rows.append(converted)

    return rows
