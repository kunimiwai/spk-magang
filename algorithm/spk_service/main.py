from __future__ import annotations

import logging
from collections.abc import Sequence

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from spk_algorithm import AlgorithmInputError, kmeans, saw

from .schemas import (
    ErrorBody,
    ErrorDetail,
    ErrorResponse,
    HealthData,
    HealthResponse,
    KMeansRequest,
    KMeansResponse,
    KMeansResultData,
    SawRankingEntryData,
    SawRequest,
    SawResponse,
    SawResultData,
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="SPK Magang Algorithm Service",
    version="0.1.0",
    description=(
        "HTTP interface for the generic K-Means and SAW functions. "
        "No business criteria, weights, cluster count, or recommendation rules "
        "are defined here."
    ),
)


@app.get("/health", response_model=HealthResponse, tags=["service"])
def health() -> HealthResponse:
    return HealthResponse(
        data=HealthData(status="ok", service="spk-algorithm")
    )


@app.post("/kmeans", response_model=KMeansResponse, tags=["algorithms"])
def run_kmeans(payload: KMeansRequest) -> KMeansResponse:
    result = kmeans(
        data=payload.data,
        n_clusters=payload.n_clusters,
        random_seed=payload.random_seed,
        max_iterations=payload.max_iterations,
        tolerance=payload.tolerance,
    )

    return KMeansResponse(
        data=KMeansResultData(
            labels=list(result.labels),
            centroids=[list(centroid) for centroid in result.centroids],
            iterations=result.iterations,
            inertia=result.inertia,
            converged=result.converged,
        )
    )


@app.post("/saw", response_model=SawResponse, tags=["algorithms"])
def run_saw(payload: SawRequest) -> SawResponse:
    result = saw(
        matrix=payload.matrix,
        weights=payload.weights,
        criteria_types=payload.criteria_types,
    )

    return SawResponse(
        data=SawResultData(
            normalized_matrix=[list(row) for row in result.normalized_matrix],
            scores=list(result.scores),
            ranking=[
                SawRankingEntryData(
                    alternative_index=entry.alternative_index,
                    score=entry.score,
                    rank=entry.rank,
                )
                for entry in result.ranking
            ],
        )
    )


@app.exception_handler(AlgorithmInputError)
async def handle_algorithm_input_error(
    request: Request,
    exc: AlgorithmInputError,
) -> JSONResponse:
    return _error_response(
        status_code=422,
        code="invalid_input",
        message=str(exc),
    )


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    details = [
        ErrorDetail(
            field=_format_location(error.get("loc", ())),
            message=str(error.get("msg", "Nilai tidak valid.")),
        )
        for error in exc.errors()
    ]

    return _error_response(
        status_code=422,
        code="invalid_request",
        message="Input request tidak valid.",
        details=details,
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception(
        "Unhandled error while processing %s %s",
        request.method,
        request.url.path,
    )

    return _error_response(
        status_code=500,
        code="internal_error",
        message="Terjadi kesalahan internal.",
    )


def _format_location(location: Sequence[object]) -> str:
    parts = [str(part) for part in location if part != "body"]

    if not parts:
        return "request"

    formatted = parts[0]

    for part in parts[1:]:
        if part.isdigit():
            formatted += f"[{part}]"
        else:
            formatted += f".{part}"

    return formatted


def _error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    details: Sequence[ErrorDetail] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorBody(
            code=code,
            message=message,
            details=list(details or []),
        )
    )

    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
    )
