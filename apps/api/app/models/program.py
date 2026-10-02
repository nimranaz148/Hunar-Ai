"""Program (cohort batch) database model."""

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Program(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Programs represent cohort batches (e.g. 'Lahore Batch 1')."""

    __tablename__ = "programs"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    invite_code: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=True,
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="program")
