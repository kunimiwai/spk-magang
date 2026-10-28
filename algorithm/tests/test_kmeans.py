import unittest

from spk_algorithm import AlgorithmInputError, kmeans
from tests.fixtures import SYNTHETIC_KMEANS_TWO_GROUPS


class KMeansTest(unittest.TestCase):
    def test_synthetic_two_groups_are_separated(self) -> None:
        result = kmeans(SYNTHETIC_KMEANS_TWO_GROUPS, 2, random_seed=7)

        self.assertEqual(len(result.labels), len(SYNTHETIC_KMEANS_TWO_GROUPS))
        self.assertEqual(len(set(result.labels[:3])), 1)
        self.assertEqual(len(set(result.labels[3:])), 1)
        self.assertNotEqual(result.labels[0], result.labels[3])
        self.assertTrue(result.converged)
        self.assertGreaterEqual(result.inertia, 0.0)
        self.assertEqual(len(result.centroids), 2)
        self.assertEqual(len(result.centroids[0]), 2)

        for label in result.labels:
            self.assertIn(label, {0, 1})

    def test_same_seed_produces_same_result(self) -> None:
        first = kmeans(SYNTHETIC_KMEANS_TWO_GROUPS, 2, random_seed=11)
        second = kmeans(SYNTHETIC_KMEANS_TWO_GROUPS, 2, random_seed=11)

        self.assertEqual(first, second)

    def test_input_is_not_mutated(self) -> None:
        data = [list(row) for row in SYNTHETIC_KMEANS_TWO_GROUPS]
        snapshot = [list(row) for row in data]

        kmeans(data, 2, random_seed=3)

        self.assertEqual(data, snapshot)

    def test_single_cluster_is_supported(self) -> None:
        result = kmeans(SYNTHETIC_KMEANS_TWO_GROUPS, 1, random_seed=0)

        self.assertEqual(
            result.labels,
            (0,) * len(SYNTHETIC_KMEANS_TWO_GROUPS),
        )

    def test_random_seed_is_required(self) -> None:
        with self.assertRaises(TypeError):
            kmeans(SYNTHETIC_KMEANS_TWO_GROUPS, 2)  # type: ignore[call-arg]

    def test_empty_data_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans([], 1, random_seed=0)

    def test_inconsistent_dimensions_are_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans([(1.0, 2.0), (3.0,)], 1, random_seed=0)

    def test_non_numeric_value_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans([(1.0, "x")], 1, random_seed=0)  # type: ignore[list-item]

    def test_boolean_value_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans([(True, 2.0)], 1, random_seed=0)  # type: ignore[list-item]

    def test_non_finite_value_is_rejected(self) -> None:
        for value in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(value=value):
                with self.assertRaises(AlgorithmInputError):
                    kmeans([(1.0, value)], 1, random_seed=0)

    def test_invalid_cluster_count_is_rejected(self) -> None:
        for n_clusters in (0, -1, 7):
            with self.subTest(n_clusters=n_clusters):
                with self.assertRaises(AlgorithmInputError):
                    kmeans(
                        SYNTHETIC_KMEANS_TWO_GROUPS,
                        n_clusters,
                        random_seed=0,
                    )

    def test_non_integer_cluster_count_is_rejected(self) -> None:
        for n_clusters in (2.0, "2", True):
            with self.subTest(n_clusters=n_clusters):
                with self.assertRaises(AlgorithmInputError):
                    kmeans(
                        SYNTHETIC_KMEANS_TWO_GROUPS,
                        n_clusters,  # type: ignore[arg-type]
                        random_seed=0,
                    )

    def test_invalid_seed_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans(  # type: ignore[arg-type]
                SYNTHETIC_KMEANS_TWO_GROUPS,
                2,
                random_seed="7",
            )

    def test_invalid_training_config_is_rejected(self) -> None:
        with self.assertRaises(AlgorithmInputError):
            kmeans(
                SYNTHETIC_KMEANS_TWO_GROUPS,
                2,
                random_seed=0,
                max_iterations=0,
            )

        with self.assertRaises(AlgorithmInputError):
            kmeans(
                SYNTHETIC_KMEANS_TWO_GROUPS,
                2,
                random_seed=0,
                tolerance=-1,
            )


if __name__ == "__main__":
    unittest.main()
