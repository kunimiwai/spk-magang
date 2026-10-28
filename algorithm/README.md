# Algorithm

Generic K-Means and SAW engine plus a FastAPI HTTP service for SPK Magang.

This package contains **no business parameters**. Criteria, weights,
benefit/cost assignments, clustering attributes, the official cluster count,
value scales, and the backend–algorithm integration contract are not defined
here. Callers must supply all of them explicitly.

## Public API

```python
from spk_algorithm import kmeans, saw

cluster_result = kmeans(
    data=[[0.0, 0.0], [0.5, 0.4], [10.0, 10.0]],
    n_clusters=2,
    random_seed=42,
)

saw_result = saw(
    matrix=[[4.0, 3.0], [2.0, 5.0], [3.0, 1.0]],
    weights=[0.6, 0.4],
    criteria_types=["benefit", "cost"],
)
```

### `kmeans(data, n_clusters, *, random_seed, max_iterations=100, tolerance=1e-9)`

Returns `KMeansResult(labels, centroids, iterations, inertia, converged)`.

- `data` is a non-empty matrix of finite numbers with consistent dimensions.
- `n_clusters` must be an integer between `1` and the number of samples.
- `random_seed` is required and must be an integer.
- Cluster order is arbitrary and is not a business cluster identity.
- An empty cluster retains its previous centroid.

### `saw(matrix, weights, criteria_types)`

Returns `SawResult(normalized_matrix, scores, ranking)`.

- Matrix rows are alternatives; columns are criteria.
- Values must be finite and non-negative.
- `weights` and `criteria_types` must match the criteria count.
- Criteria types are exactly `"benefit"` or `"cost"`.
- Weights are used as supplied; they are never rescaled.
- Equal scores share a rank (competition ranking).
- An all-zero benefit column and any zero value in a cost column raise
  `AlgorithmInputError`; no fallback or hidden ranking is produced.

## Invalid input

Both functions raise `spk_algorithm.AlgorithmInputError` (a `ValueError`) for
empty data, inconsistent dimensions, non-numeric or non-finite values, invalid
cluster counts, invalid weights, and unknown criteria types. Inputs are never
mutated.

## HTTP service

The FastAPI app lives in `spk_service/` and calls the engine functions above.
It does not add business defaults or a recommendation endpoint.

### Install

```bash
cd algorithm
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
```

### Run

```bash
uvicorn spk_service.main:app --host 127.0.0.1 --port 8001 --reload
```

Endpoints:

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health |
| POST | `/kmeans` | Run generic K-Means |
| POST | `/saw` | Run generic SAW |

### Example K-Means request

```bash
curl -sS http://127.0.0.1:8001/kmeans \
  -H 'Content-Type: application/json' \
  -d '{
    "data": [[0.0, 0.0], [0.5, 0.4], [10.0, 10.0]],
    "n_clusters": 2,
    "random_seed": 42
  }'
```

### Example SAW request

```bash
curl -sS http://127.0.0.1:8001/saw \
  -H 'Content-Type: application/json' \
  -d '{
    "matrix": [[4.0, 3.0], [2.0, 5.0], [3.0, 1.0]],
    "weights": [0.6, 0.4],
    "criteria_types": ["benefit", "cost"]
  }'
```

### Error envelope

Request-shape errors and engine contract errors both return HTTP 422 with the
same shape:

```json
{
  "success": false,
  "error": {
    "code": "invalid_input",
    "message": "n_clusters minimal 1.",
    "details": []
  }
}
```

`invalid_request` is used for Pydantic request-shape/type errors and includes
field-level `details`. No stack trace or internal module detail is returned.

## Tests

The tests use only synthetic fixtures; see `tests/fixtures.py`.

```bash
cd algorithm
pip install -e '.[test]'
python3 -m unittest discover -s tests -t . -v
```
