"""Report model."""
from sqlalchemy import (
    Column, Integer, String, DateTime,
    ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(10), nullable=False)
    target_id = Column(Integer, nullable=False)
    reason = Column(String(20), nullable=False)
    details = Column(String(500))
    status = Column(String(10), nullable=False, default="open", server_default="open")
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_note = Column(String(300))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "target_type IN ('listing','user')",
            name="report_target_type_check"
        ),
        CheckConstraint(
            "reason IN ('spam','prohibited_item','scam','inappropriate','other')",
            name="report_reason_check"
        ),
        CheckConstraint(
            "status IN ('open','resolved','dismissed')",
            name="report_status_check"
        ),
    )

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
    resolver = relationship("User", foreign_keys=[resolved_by])
