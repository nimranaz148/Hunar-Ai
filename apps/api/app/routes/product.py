"""Product routes for business offering editor (F-005 / PRD §5.2, §13.2)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.product import (
    CreateProductRequest,
    ProductResponse,
    UpdateProductRequest,
)
from app.services.product import (
    create_product,
    delete_product,
    get_product,
    list_products_for_business,
    update_product,
)

router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/products",
    tags=["products"],
)


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="List all products for a business",
)
async def list_products(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProductResponse]:
    """Retrieve all products/services offered by the business."""
    products = await list_products_for_business(db, business_id, current_user)
    return [ProductResponse.model_validate(p) for p in products]


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product or service for a business",
)
async def create_new_product(
    business_id: uuid.UUID,
    payload: CreateProductRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductResponse:
    """Create a new product offering with itemized cost inputs and selling price."""
    product = await create_product(db, business_id, current_user, payload)
    return ProductResponse.model_validate(product)


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get single product by ID",
)
async def get_single_product(
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductResponse:
    """Retrieve a single product offering by ID."""
    product = await get_product(db, business_id, product_id, current_user)
    return ProductResponse.model_validate(product)


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details",
)
async def update_single_product(
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: UpdateProductRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductResponse:
    """Update product name, description, cost inputs, or selling price."""
    product = await update_product(db, business_id, product_id, current_user, payload)
    return ProductResponse.model_validate(product)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
async def delete_single_product(
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a product offering."""
    await delete_product(db, business_id, product_id, current_user)
