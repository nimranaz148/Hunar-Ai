"""Common reusable schemas: RFC 7807 problem details and pagination."""

from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    """Specific field-level or item-level error."""

    model_config = ConfigDict(extra="forbid")

    field: str | None = Field(
        default=None,
        description="Field path causing the error if applicable",
    )
    message: str = Field(..., description="Human-readable description of the error")


class ProblemDetails(BaseModel):
    """RFC 7807 compliant problem details response."""

    model_config = ConfigDict(extra="forbid")

    type: str = Field(..., description="URI reference or slug identifying problem type")
    title: str = Field(..., description="Short, human-readable summary of problem type")
    status: int = Field(..., description="HTTP status code")
    detail: str = Field(..., description="Human-readable explanation specific to this occurrence")
    instance: str | None = Field(
        default=None,
        description="URI reference identifying specific occurrence",
    )
    errors: list[ErrorDetail] | None = Field(
        default=None,
        description="Detailed validation or sub-errors",
    )


class PaginatedResponse[T](BaseModel):
    """Standard pagination wrapper returning items, total count, and page info."""

    model_config = ConfigDict(extra="forbid", arbitrary_types_allowed=True)

    items: list[T] = Field(..., description="Page items")
    total: int = Field(..., ge=0, description="Total count of matching items")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(..., ge=1, le=100, description="Number of items per page")
