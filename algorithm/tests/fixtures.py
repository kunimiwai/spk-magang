"""Synthetic fixtures for generic algorithm tests.

Every constant here is artificial and exists only to exercise the generic
functions. These values are not partner, student, criteria, weight, or score
data from the SPK Magang domain.
"""

SYNTHETIC_KMEANS_TWO_GROUPS: tuple[tuple[float, ...], ...] = (
    (0.0, 0.0),
    (0.5, 0.4),
    (0.2, 0.9),
    (10.0, 10.0),
    (10.4, 9.8),
    (9.7, 10.2),
)

SYNTHETIC_SAW_MATRIX: tuple[tuple[float, ...], ...] = (
    (4.0, 3.0),
    (2.0, 5.0),
    (3.0, 1.0),
)

SYNTHETIC_SAW_WEIGHTS: tuple[float, ...] = (0.6, 0.4)

SYNTHETIC_SAW_CRITERIA_TYPES: tuple[str, ...] = ("benefit", "cost")
