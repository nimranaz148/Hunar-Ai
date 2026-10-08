"""FastAPI application entry point with lifespan management."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.errors import register_exception_handlers
from app.core.middleware import RequestIdMiddleware
from app.routes.admin import flags_router, router as admin_router
from app.routes.agents import router as agents_router
from app.routes.auth import router as auth_router
from app.routes.booking import bookings_router
from app.routes.business import router as business_router
from app.routes.content import router as content_router
from app.routes.mentor import mentors_router, services_router
from app.routes.metrics import metrics_router
from app.routes.onboarding import router as onboarding_router
from app.routes.plan import router as plan_router
from app.routes.pricing import router as pricing_router
from app.routes.product import router as product_router
from app.routes.proposals import proposals_router
from app.routes.validation import router as validation_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown hooks."""
    # Startup: database connection pool, etc.
    yield
    # Shutdown: close connections, etc.


app = FastAPI(
    title="Hunar v2 API",
    version="0.1.0",
    description="AI-powered platform for Pakistani home-business women",
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
)

# Register RFC 7807 global exception handlers
register_exception_handlers(app)

# Correlation ID Middleware
app.add_middleware(RequestIdMiddleware)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router)
app.include_router(flags_router)
app.include_router(onboarding_router)
app.include_router(business_router)
app.include_router(product_router)
app.include_router(pricing_router)
app.include_router(plan_router)
app.include_router(content_router)
app.include_router(services_router)
app.include_router(mentors_router)
app.include_router(bookings_router)
app.include_router(metrics_router)
app.include_router(proposals_router)
app.include_router(validation_router)
app.include_router(agents_router)


@app.get("/api/v1/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}
