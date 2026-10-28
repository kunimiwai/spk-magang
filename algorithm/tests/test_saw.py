import unittest

from spk_algorithm import AlgorithmInputError, saw
from tests.fixtures import (
    SYNTHETIC_SAW_CRITERIA_TYPES,
    SYNTHETIC_SAW_MATRIX,
    SYNTHETIC_SAW_WEIGHTS,
)


class SawTest(unittest.TestCase):
    def test_synthetic_matrix_normalization_scores_and_ranking(self) -> None:
        result = saw(
            SYNTHETIC_SAW_MATRIX,
            SYNTHETIC_SAW_WEIGHTS,
            SYNTHETIC_SAW_CRITERIA_TYPES,
        )

        expected_normalized = (
            (1.0, 1.0 / 3.0),
            (0.5, 1.0 / 5.0),
            (0.75, 1.0),
        )

        for row_index, expected_row in enumerate(expected_normalized):
            for criterion_index, expected in enumerate(expected_row):
                self.assertAlmostEqual(
                    result.normalized_matrix[row_index][criterion_index],
                    expected,
                    places=12,
                )

        expected_scores = (
            0.6 * 1.0 + 0.4 * (1.0 / 3.0),
            0.6 * 0.5 + 0.4 * 0.2,
            0.6 * 0.75 + 0.4 * 1.0,
        )

        for index, expected in enumerate(expected_scores):
            self.assertAlmostEqual(result.scores[index], expected, places=12)

        self.assertEqual(
            [entry.alternative_index for entry in result.ranking],
            [2, 0, 1],
        )
        self.assertEqual(
            [entry.rank for entry in result.ranking],
            [1, 2, 3],
        )

    def test_equal_scores_share_a_rank(self) -> None:
        result = saw(((1.0,), (1.0,)), (1.0,), ("benefit",))

        self.assertEqual(
            [entry.alternative_index for entry in result.ranking],
            [0, 1],
        )
        self.assertEqual([entry.rank for entry in result.ranking], [1, 1])

    def test_zero_benefit_value_is_allowed_when_column_max_is_positive(
        self,
    ) -> None:
        result = saw(
            ((0.0, 5.0), (2.0, 4.0)),
            (0.5, 0.5),
            ("benefit", "cost"),
        )

        self.assertEqual(result.normalized_matrix[0][0], 0.0)
        self.assertAlmostEqual(result.normalized_matrix[0][1], 4.0 / 5.0)
        self.assertAlmostEqual(result.normalized_matrix[1][0], 1.0)
        self.assertAlmostEqual(result.normalized_matrix[1][1], 1.0)

    def test_all_zero_benefit_column_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(
                ((0.0, 1.0), (0.0, 2.0)),
                (0.5, 0.5),
                ("benefit", "benefit"),
            )

    def test_cost_column_containing_zero_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(
                ((1.0, 0.0), (2.0, 3.0)),
                (0.5, 0.5),
                ("benefit", "cost"),
            )

    def test_input_is_not_mutated(self) -> None:
        matrix = [list(row) for row in SYNTHETIC_SAW_MATRIX]
        weights = list(SYNTHETIC_SAW_WEIGHTS)
        criteria_types = list(SYNTHETIC_SAW_CRITERIA_TYPES)
        matrix_snapshot = [list(row) for row in matrix]
        weights_snapshot = list(weights)
        types_snapshot = list(criteria_types)

        saw(matrix, weights, criteria_types)

        self.assertEqual(matrix, matrix_snapshot)
        self.assertEqual(weights, weights_snapshot)
        self.assertEqual(criteria_types, types_snapshot)

    def test_empty_matrix_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw((), (1.0,), ("benefit",))

    def test_inconsistent_dimensions_are_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(((1.0, 2.0), (3.0,)), (0.5, 0.5), ("benefit", "cost"))

    def test_non_numeric_value_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(((1.0, "x"),), (0.5, 0.5), ("benefit", "cost"))  # type: ignore[list-item]

    def test_negative_matrix_value_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(((-1.0, 2.0),), (0.5, 0.5), ("benefit", "cost"))

    def test_weight_length_mismatch_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(SYNTHETIC_SAW_MATRIX, (1.0,), SYNTHETIC_SAW_CRITERIA_TYPES)

    def test_criteria_type_length_mismatch_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(SYNTHETIC_SAW_MATRIX, SYNTHETIC_SAW_WEIGHTS, ("benefit",))

    def test_unknown_criteria_type_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(SYNTHETIC_SAW_MATRIX, SYNTHETIC_SAW_WEIGHTS, ("BENEFIT", "cost"))

    def test_negative_weight_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(SYNTHETIC_SAW_MATRIX, (1.1, -0.1), SYNTHETIC_SAW_CRITERIA_TYPES)

    def test_zero_total_weight_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            saw(SYNTHETIC_SAW_MATRIX, (0.0, 0.0), SYNTHETIC_SAW_CRITERIA_TYPES)

    def test_non_finite_weight_is_rejected(self) -> None:
        for weight in (float("nan"), float("inf")):
            with self.subTest(weight=weight):
                with self.assertRaises(AlgorithmInputError):
                    saw(
                        SYNTHETIC_SAW_MATRIX,
                        (1.0, weight),
                        SYNTHETIC_SAW_CRITERIA_TYPES,
                    )


if __name__ == "__main__":
    unittest.main()
