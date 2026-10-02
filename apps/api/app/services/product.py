"""Product service layer for offering management (F-005 / PRD §5.2, §12.3, §14.1)."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.models.business import Product
from app.models.user import User
from app.schemas.product import CreateProductRequest, UpdateProductRequest
from app.services.business import get_business_by_id


async def list_products_for_business(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> list[Product]:
    """Retrieve all products for a business, verifying access."""
    # Ensure user has access to view this business
    await get_business_by_id(db, business_id, user)

    stmt = select(Product).where(Product.business_id == business_id).order_by(Product.created_at.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def create_product(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    data: CreateProductRequest,
) -> Product:
    """Create a new product for a business with ownership check and audit logging."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can add products.",
        )

    cost_inputs_raw = [c.model_dump() for c in data.cost_inputs]

    product = Product(
        id=uuid.uuid4(),
        business_id=business_id,
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        cost_inputs=cost_inputs_raw,
        price_pkr=data.price_pkr,
        created_at=datetime.now(UTC),
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)

    await record_audit_log(
        db=db,
        action="product.created",
        actor_id=user.id,
        actor_role=user.role,
        target_type="product",
        target_id=str(product.id),
        program_id=business.program_id,
        after={
            "id": str(product.id),
            "business_id": str(business_id),
            "name": product.name,
            "cost_inputs": cost_inputs_raw,
            "price_pkr": product.price_pkr,
        },
    )

    return product


async def get_product(
    db: AsyncSession,
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    user: User,
) -> Product:
    """Retrieve a single product offering with ownership verification."""
    await get_business_by_id(db, business_id, user)

    stmt = select(Product).where(
        Product.id == product_id,
        Product.business_id == business_id,
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


async def update_product(
    db: AsyncSession,
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    user: User,
    data: UpdateProductRequest,
) -> Product:
    """Update a product offering with price/cost validation and audit logging."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can update products.",
        )

    stmt = select(Product).where(
        Product.id == product_id,
        Product.business_id == business_id,
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    before_state: dict[str, Any] = {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "cost_inputs": product.cost_inputs,
        "price_pkr": product.price_pkr,
    }

    # If updating cost_inputs or price_pkr, ensure price >= total cost
    new_costs_raw = [c.model_dump() for c in data.cost_inputs] if data.cost_inputs is not None else product.cost_inputs
    new_price = data.price_pkr if data.price_pkr is not None else product.price_pkr

    total_cost = sum(item.get("amount_pkr", 0) for item in new_costs_raw)
    if new_price < total_cost:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Selling price (PKR {new_price:,}) cannot be less than total itemized costs (PKR {total_cost:,}).",
        )

    if data.name is not None:
        product.name = data.name.strip()
    if data.description is not None:
        product.description = data.description.strip() if data.description else None
    if data.cost_inputs is not None:
        product.cost_inputs = new_costs_raw
    if data.price_pkr is not None:
        product.price_pkr = data.price_pkr

    await db.flush()
    await db.refresh(product)

    after_state: dict[str, Any] = {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "cost_inputs": product.cost_inputs,
        "price_pkr": product.price_pkr,
    }

    await record_audit_log(
        db=db,
        action="product.updated",
        actor_id=user.id,
        actor_role=user.role,
        target_type="product",
        target_id=str(product.id),
        program_id=business.program_id,
        before=before_state,
        after=after_state,
    )

    return product


async def delete_product(
    db: AsyncSession,
    business_id: uuid.UUID,
    product_id: uuid.UUID,
    user: User,
) -> None:
    """Delete a product offering with ownership verification and audit logging."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can delete products.",
        )

    stmt = select(Product).where(
        Product.id == product_id,
        Product.business_id == business_id,
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    before_state: dict[str, Any] = {
        "id": str(product.id),
        "name": product.name,
        "cost_inputs": product.cost_inputs,
        "price_pkr": product.price_pkr,
    }

    await db.delete(product)
    await db.flush()

    await record_audit_log(
        db=db,
        action="product.deleted",
        actor_id=user.id,
        actor_role=user.role,
        target_type="product",
        target_id=str(product_id),
        program_id=business.program_id,
        before=before_state,
    )

