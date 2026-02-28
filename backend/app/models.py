"""SQLAlchemy models."""
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.database import Base


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(100), unique=True, index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    color = Column(String(100), nullable=False)
    delivery_date = Column(Date, nullable=False)
    status = Column(String(50), default="pending")
    consolidated_batch_id = Column(Integer, ForeignKey("consolidated_batches.id"), nullable=True)
    production_plan_id = Column(Integer, ForeignKey("production_plans.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    consolidated_batch = relationship("ConsolidatedBatch", back_populates="orders")
    production_plan = relationship("ProductionPlan", back_populates="orders")


class ConsolidatedBatch(Base):
    __tablename__ = "consolidated_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    color = Column(String(100), nullable=False)
    total_quantity = Column(Integer, nullable=False)
    order_ids = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    production_plan_id = Column(Integer, ForeignKey("production_plans.id"), nullable=True)

    orders = relationship("SalesOrder", back_populates="consolidated_batch")
    production_plan = relationship("ProductionPlan", back_populates="batch")


class ProductionPlan(Base):
    __tablename__ = "production_plans"

    id = Column(Integer, primary_key=True, index=True)
    planned_date = Column(Date, nullable=False)
    batch_id = Column(Integer, ForeignKey("consolidated_batches.id"), nullable=True)
    quantity_planned = Column(Integer, nullable=False)
    status = Column(String(50), default="scheduled")
    machine_id = Column(Integer, ForeignKey("machines.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("SalesOrder", back_populates="production_plan")
    batch = relationship("ConsolidatedBatch", back_populates="production_plan", foreign_keys="ProductionPlan.batch_id")
    machine = relationship("Machine", back_populates="plans")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    raw_materials = relationship("ProductRawMaterial", back_populates="product", cascade="all, delete-orphan")


class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    unit = Column(String(50), default="kg")
    created_at = Column(DateTime, default=datetime.utcnow)

    product_rms = relationship("ProductRawMaterial", back_populates="raw_material")


class ProductRawMaterial(Base):
    __tablename__ = "product_raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity_per_unit = Column(Float, nullable=False)

    product = relationship("Product", back_populates="raw_materials")
    raw_material = relationship("RawMaterial", back_populates="product_rms")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    capacity_per_day = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plans = relationship("ProductionPlan", back_populates="machine")
