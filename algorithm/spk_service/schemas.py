from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictRequest(BaseModel):
    """Reject unknown fields and implicit type coercion at the HTTP boundary."""

    model_config = ConfigDict(extra="forbid", strict=True)


class KMeansRequest(StrictRequest):
    data: list[list[float]]
    n_clusters: int
    random_seed: int
    max_iterations: int = 100
    tolerance: float = 1e-9


class KMeansResultData(BaseModel):
    labels: list[int]
    centroids: list[list[float]]
    iterations: int
    inertia: float
    converged: bool


class KMeansResponse(BaseModel):
    success: Literal[True] = True
    data: KMeansResultData


class SawRequest(StrictRequest):
    matrix: list[list[float]]
    weights: list[float]
    criteria_types: list[str]


class SawRankingEntryData(BaseModel):
    alternative_index: int
    score: float
    rank: int


class SawResultData(BaseModel):
    normalized_matrix: list[list[float]]
    scores: list[float]
    ranking: list[SawRankingEntryData]


class SawResponse(BaseModel):
    success: Literal[True] = True
    data: SawResultData


class HealthData(BaseModel):
    status: Literal["ok"]
    service: str


class HealthResponse(BaseModel):
    success: Literal[True] = True
    data: HealthData


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    success: Literal[False] = False
    error: ErrorBody
