from __future__ import annotations

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass

from ._validation import validate_matrix
from .errors import AlgorithmInputError


@dataclass(frozen=True)
class KMeansResult:
    """Generic K-Means output.

    ``labels[i]`` is the cluster assigned to ``data[i]``. Centroid order is
    arbitrary and must not be interpreted as a business cluster identity.

    If a cluster receives no samples, its previous centroid is retained. This
    keeps the output well-defined without inventing a relocation rule.
    """

    labels: tuple[int, ...]
    centroids: tuple[tuple[float, ...], ...]
    iterations: int
    inertia: float
    converged: bool


def kmeans(
    data: Sequence[Sequence[float]],
    n_clusters: int,
    *,
    random_seed: int,
    max_iterations: int = 100,
    tolerance: float = 1e-9,
) -> KMeansResult:
    """Run generic Lloyd K-Means on a numeric matrix.

    The caller must supply the cluster count and random seed explicitly. No
    business attributes, official cluster count, or clustering target are
    assumed by this function.

    Raises ``AlgorithmInputError`` for empty data, inconsistent dimensions,
    non-numeric or non-finite values, an invalid cluster count, an invalid
    seed, or invalid iteration/tolerance settings.
    """

    samples = validate_matrix(data, name="data")
    cluster_count = _validate_cluster_count(n_clusters, len(samples))
    _validate_training_config(max_iterations, tolerance)
    seed = _validate_random_seed(random_seed)

    rng = random.Random(seed)
    initial_indices = rng.sample(range(len(samples)), cluster_count)
    centroids = [list(samples[index]) for index in initial_indices]

    labels = [-1] * len(samples)
    converged = False
    iterations = 0

    for iteration in range(1, max_iterations + 1):
        iterations = iteration

        next_labels = [_nearest_cluster(sample, centroids) for sample in samples]
        next_centroids = _recompute_centroids(
            samples, next_labels, cluster_count, centroids
        )
        shift = _max_centroid_shift(centroids, next_centroids)
        labels_unchanged = next_labels == labels

        labels = next_labels
        centroids = next_centroids

        if labels_unchanged or shift <= tolerance:
            converged = True
            break

    inertia = sum(
        _squared_distance(sample, centroids[label])
        for sample, label in zip(samples, labels)
    )

    return KMeansResult(
        labels=tuple(labels),
        centroids=tuple(tuple(centroid) for centroid in centroids),
        iterations=iterations,
        inertia=inertia,
        converged=converged,
    )


def _validate_cluster_count(n_clusters: object, sample_count: int) -> int:
    if isinstance(n_clusters, bool) or not isinstance(n_clusters, int):
        raise AlgorithmInputError("n_clusters harus berupa bilangan bulat.")

    if n_clusters < 1:
        raise AlgorithmInputError("n_clusters minimal 1.")

    if n_clusters > sample_count:
        raise AlgorithmInputError(
            f"n_clusters ({n_clusters}) tidak boleh melebihi jumlah sampel "
            f"({sample_count})."
        )

    return n_clusters


def _validate_random_seed(random_seed: object) -> int:
    if isinstance(random_seed, bool) or not isinstance(random_seed, int):
        raise AlgorithmInputError("random_seed harus berupa bilangan bulat.")

    return random_seed


def _validate_training_config(
    max_iterations: object,
    tolerance: object,
) -> None:
    if (
        isinstance(max_iterations, bool)
        or not isinstance(max_iterations, int)
        or max_iterations < 1
    ):
        raise AlgorithmInputError(
            "max_iterations harus berupa bilangan bulat minimal 1."
        )

    if isinstance(tolerance, bool) or not isinstance(tolerance, (int, float)):
        raise AlgorithmInputError("tolerance harus berupa angka >= 0.")

    if not math.isfinite(float(tolerance)) or float(tolerance) < 0:
        raise AlgorithmInputError("tolerance harus berupa angka >= 0.")


def _nearest_cluster(
    sample: Sequence[float],
    centroids: Sequence[Sequence[float]],
) -> int:
    best_cluster = 0
    best_distance = _squared_distance(sample, centroids[0])

    for cluster_index in range(1, len(centroids)):
        distance = _squared_distance(sample, centroids[cluster_index])

        if distance < best_distance:
            best_distance = distance
            best_cluster = cluster_index

    return best_cluster


def _recompute_centroids(
    samples: Sequence[Sequence[float]],
    labels: Sequence[int],
    cluster_count: int,
    previous_centroids: Sequence[Sequence[float]],
) -> list[list[float]]:
    dimensions = len(samples[0])
    sums = [[0.0] * dimensions for _ in range(cluster_count)]
    counts = [0] * cluster_count

    for sample, label in zip(samples, labels):
        counts[label] += 1

        for dimension, value in enumerate(sample):
            sums[label][dimension] += value

    centroids: list[list[float]] = []

    for cluster_index in range(cluster_count):
        count = counts[cluster_index]

        if count == 0:
            centroids.append(list(previous_centroids[cluster_index]))
        else:
            centroids.append(
                [total / count for total in sums[cluster_index]]
            )

    return centroids


def _max_centroid_shift(
    previous: Sequence[Sequence[float]],
    current: Sequence[Sequence[float]],
) -> float:
    return max(
        math.sqrt(_squared_distance(old, new))
        for old, new in zip(previous, current)
    )


def _squared_distance(
    first: Sequence[float],
    second: Sequence[float],
) -> float:
    return sum((left - right) ** 2 for left, right in zip(first, second))
