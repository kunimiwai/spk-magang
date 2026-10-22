import unittest

from fastapi.testclient import TestClient

from spk_algorithm import kmeans, saw
from spk_service.main import app
from tests.fixtures import (
    SYNTHETIC_KMEANS_TWO_GROUPS,
    SYNTHETIC_SAW_CRITERIA_TYPES,
    SYNTHETIC_SAW_MATRIX,
    SYNTHETIC_SAW_WEIGHTS,
)


class HealthEndpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_returns_ok(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "success": True,
                "data": {"status": "ok", "service": "spk-algorithm"},
            },
        )


class KMeansEndpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.payload = {
            "data": [list(row) for row in SYNTHETIC_KMEANS_TWO_GROUPS],
            "n_clusters": 2,
            "random_seed": 7,
        }

    def test_returns_serialized_engine_result(self) -> None:
        response = self.client.post("/kmeans", json=self.payload)

        self.assertEqual(response.status_code, 200)

        body = response.json()
        self.assertTrue(body["success"])

        expected = kmeans(
            SYNTHETIC_KMEANS_TWO_GROUPS,
            2,
            random_seed=7,
        )
        data = body["data"]

        self.assertEqual(data["labels"], list(expected.labels))
        self.assertEqual(
            data["centroids"],
            [list(centroid) for centroid in expected.centroids],
        )
        self.assertEqual(data["iterations"], expected.iterations)
        self.assertEqual(data["inertia"], expected.inertia)
        self.assertEqual(data["converged"], expected.converged)

    def test_missing_random_seed_returns_consistent_422(self) -> None:
        payload = dict(self.payload)
        del payload["random_seed"]

        response = self.client.post("/kmeans", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["code"], "invalid_request")
        self.assertEqual(body["error"]["details"][0]["field"], "random_seed")

    def test_engine_empty_data_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["data"] = []

        response = self.client.post("/kmeans", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("tidak boleh kosong", body["error"]["message"])

    def test_engine_cluster_count_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["n_clusters"] = 0

        response = self.client.post("/kmeans", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("n_clusters minimal 1", body["error"]["message"])

    def test_engine_dimension_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["data"] = [[1.0, 2.0], [3.0]]

        response = self.client.post("/kmeans", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("Dimensi", body["error"]["message"])

    def test_non_numeric_value_returns_consistent_422(self) -> None:
        payload = dict(self.payload)
        payload["data"] = [[1.0, "x"]]

        response = self.client.post("/kmeans", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_request")
        self.assertNotIn("traceback", response.text.lower())
        self.assertNotIn("spk_algorithm", response.text)


class SawEndpointTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.payload = {
            "matrix": [list(row) for row in SYNTHETIC_SAW_MATRIX],
            "weights": list(SYNTHETIC_SAW_WEIGHTS),
            "criteria_types": list(SYNTHETIC_SAW_CRITERIA_TYPES),
        }

    def test_returns_serialized_engine_result(self) -> None:
        response = self.client.post("/saw", json=self.payload)

        self.assertEqual(response.status_code, 200)

        body = response.json()
        self.assertTrue(body["success"])

        expected = saw(
            SYNTHETIC_SAW_MATRIX,
            SYNTHETIC_SAW_WEIGHTS,
            SYNTHETIC_SAW_CRITERIA_TYPES,
        )
        data = body["data"]

        for row, expected_row in zip(
            data["normalized_matrix"],
            expected.normalized_matrix,
        ):
            for value, expected_value in zip(row, expected_row):
                self.assertAlmostEqual(value, expected_value, places=12)

        for value, expected_value in zip(data["scores"], expected.scores):
            self.assertAlmostEqual(value, expected_value, places=12)

        self.assertEqual(
            data["ranking"],
            [
                {
                    "alternative_index": entry.alternative_index,
                    "score": entry.score,
                    "rank": entry.rank,
                }
                for entry in expected.ranking
            ],
        )

    def test_missing_weights_returns_consistent_422(self) -> None:
        payload = dict(self.payload)
        del payload["weights"]

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_request")
        self.assertEqual(body["error"]["details"][0]["field"], "weights")

    def test_engine_criteria_type_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["criteria_types"] = ["benefit", "BENEFIT"]

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("criteria_types[1]", body["error"]["message"])

    def test_engine_weight_length_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["weights"] = [1.0]

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("Jumlah bobot", body["error"]["message"])

    def test_engine_zero_cost_validation_is_preserved(self) -> None:
        payload = dict(self.payload)
        payload["matrix"] = [[1.0, 0.0], [2.0, 3.0]]

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_input")
        self.assertIn("nilai nol", body["error"]["message"])

    def test_extra_field_returns_consistent_422(self) -> None:
        payload = dict(self.payload)
        payload["unexpected"] = True

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(body["error"]["code"], "invalid_request")
        self.assertEqual(body["error"]["details"][0]["field"], "unexpected")

    def test_error_response_does_not_expose_internal_details(self) -> None:
        payload = dict(self.payload)
        payload["criteria_types"] = ["benefit", "unknown"]

        response = self.client.post("/saw", json=payload)

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertEqual(set(body), {"success", "error"})
        self.assertLessEqual(
            set(body["error"]),
            {"code", "message", "details"},
        )
        self.assertNotIn("traceback", response.text.lower())


if __name__ == "__main__":
    unittest.main()
