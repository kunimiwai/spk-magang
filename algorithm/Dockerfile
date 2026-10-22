FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml ./
COPY spk_algorithm ./spk_algorithm
COPY spk_service ./spk_service

RUN pip install --no-cache-dir .

EXPOSE 8001

CMD ["uvicorn", "spk_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
