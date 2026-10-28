from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from ._validation import (
    as_finite_non_negative_number,
    validate_matrix,
)
from .errors import AlgorithmInputError

BENEFIT = "benefit"
COST = "cost"
_CRITERIA_TYPES = frozenset({BENEFIT, COST})


@dataclass(frozen=True)
class SawRankingEntry:
    """One entry in the generic SAW ranking.

    ``rank`` uses competition ranking: equal scores share a rank and the next
    distinct score takes the following position (for example 1, 2, 2, 4).
    """

    alternative_index: int
    score: float
    rank: int


@dataclass(frozen=True)
class SawResult:
    """Generic SAW output.

    ``normalized_matrix`` and ``scores`` keep the caller's row order.
    ``ranking`` is a separate, score-descending view. No criteria, weights,
    value scale, or benefit/cost decision is assumed by this function.
    """

    normalized_matrix: tuple[tuple[float, ...], ...]
    scores: tuple[float, ...]
    ranking: tuple[SawRankingEntry, ...]


def saw(
    matrix: Sequence[Sequence[float]],
    weights: Sequence[float],
    criteria_types: Sequence[str],
) -> SawResult:
    """Run generic Simple Additive Weighting.

    ``matrix`` rows are alternatives and columns are criteria. ``weights`` and
    ``criteria_types`` must match the number of criteria exactly. Criteria
    types are the literal strings ``"benefit"`` or ``"cost"``.

    Matrix values must be finite and non-negative. A benefit criterion whose
    values are all zero and a cost criterion containing any zero cannot be
    normalized; both raise ``AlgorithmInputError`` instead of producing a
    hidden fallback or an apparently valid ranking.
    """

    values = validate_matrix(matrix, name="matrix", non_negative=True)
    criteria_count = len(values[0])
    parsed_weights = _validate_weights(weights, criteria_count)
    parsed_types = _validate_criteria_types(criteria_types, criteria_count)

    normalized = _normalize(values, parsed_types)
    scores = tuple(
        sum(
            weight * normalized[row_index][criterion_index]
            for criterion_index, weight in enumerate(parsed_weights)
        )
        for row_index in range(len(values))
    )

    return SawResult(
        normalized_matrix=tuple(tuple(row) for row in normalized),
        scores=scores,
        ranking=_rank(scores),
    )


def _validate_weights(
    weights: object,
    criteria_count: int,
) -> list[float]:
    if isinstance(weights, (str, bytes, bytearray)) or not isinstance(
        weights, Sequence
    ):
        raise AlgorithmInputError("weights harus berupa urutan angka.")

    if len(weights) != criteria_count:
        raise AlgorithmInputError(
            f"Jumlah bobot ({len(weights)}) harus sama dengan jumlah kriteria "
            f"({criteria_count})."
        )

    parsed = [
        as_finite_non_negative_number(weight, f"weights[{index}]")
        for index, weight in enumerate(weights)
    ]

    if sum(parsed) <= 0:
        raise AlgorithmInputError("Total bobot harus lebih besar dari nol.")

    return parsed


def _validate_criteria_types(
    criteria_types: object,
    criteria_count: int,
) -> list[str]:
    if isinstance(criteria_types, (str, bytes, bytearray)) or not isinstance(
        criteria_types, Sequence
    ):
        raise AlgorithmInputError(
            "criteria_types harus berupa urutan 'benefit' atau 'cost'."
        )

    if len(criteria_types) != criteria_count:
        raise AlgorithmInputError(
            f"Jumlah criteria_types ({len(criteria_types)}) harus sama dengan "
            f"jumlah kriteria ({criteria_count})."
        )

    parsed: list[str] = []

    for index, criterion_type in enumerate(criteria_types):
        if (
            not isinstance(criterion_type, str)
            or criterion_type not in _CRITERIA_TYPES
        ):
            raise AlgorithmInputError(
                f"criteria_types[{index}] harus 'benefit' atau 'cost'."
            )

        parsed.append(criterion_type)

    return parsed


def _normalize(
    values: Sequence[Sequence[float]],
    criteria_types: Sequence[str],
) -> list[list[float]]:
    row_count = len(values)
    criteria_count = len(values[0])
    normalized = [[0.0] * criteria_count for _ in range(row_count)]

    for criterion_index in range(criteria_count):
        column = [values[row][criterion_index] for row in range(row_count)]

        if criteria_types[criterion_index] == BENEFIT:
            maximum = max(column)

            if maximum == 0:
                raise AlgorithmInputError(
                    f"Normalisasi benefit kriteria {criterion_index} tidak dapat "
                    "dilakukan karena seluruh nilainya nol."
                )

            for row_index in range(row_count):
                normalized[row_index][criterion_index] = (
                    values[row_index][criterion_index] / maximum
                )
        else:
            minimum = min(column)

            if minimum == 0:
                raise AlgorithmInputError(
                    f"Normalisasi cost kriteria {criterion_index} tidak dapat "
                    "dilakukan karena terdapat nilai nol."
                )

            for row_index in range(row_count):
                normalized[row_index][criterion_index] = (
                    minimum / values[row_index][criterion_index]
                )

    return normalized


def _rank(scores: Sequence[float]) -> tuple[SawRankingEntry, ...]:
    ordered_indices = sorted(
        range(len(scores)),
        key=lambda index: (-scores[index], index),
    )

    ranking: list[SawRankingEntry] = []
    previous_score: float | None = None
    current_rank = 0

    for position, alternative_index in enumerate(ordered_indices, start=1):
        score = scores[alternative_index]

        if previous_score is None or score != previous_score:
            current_rank = position
            previous_score = score

        ranking.append(
            SawRankingEntry(
                alternative_index=alternative_index,
                score=score,
                rank=current_rank,
            )
        )

    return tuple(ranking)
