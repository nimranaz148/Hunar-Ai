# Hunar v2 API — Production Dockerfile
# Multi-stage build using uv for dependency management

# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies using uv (production only, no dev dependencies)
RUN uv pip install --system --no-cache -r pyproject.toml

# Stage 2: Runtime
FROM python:3.12-slim

# Install system dependencies for PostgreSQL and security updates
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy uv for potential runtime operations
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create non-root user for security
RUN useradd -m -u 1000 hunar && \
    mkdir -p /app && \
    chown -R hunar:hunar /app

WORKDIR /app

# Copy application code
COPY --chown=hunar:hunar app ./app
COPY --chown=hunar:hunar alembic.ini ./
COPY --chown=hunar:hunar migrations ./migrations

# Switch to non-root user
USER hunar

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start server with uvicorn
# Use 0.0.0.0 to bind to all interfaces in container
# Workers can be configured via environment variable (default: 1)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
