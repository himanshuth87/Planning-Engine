"""Pydantic schemas."""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


# Sales Order
class SalesOrderBase(BaseModel):
    order_id: str
    product_name: str
    quantity: int
    color: str
    delivery_date: date


class SalesOrderCreate(SalesOrderBase):
    pass


class SalesOrderResponse(SalesOrderBase):
    id: int
    status: str = "pending"
    consolidated_batch_id: Optional[int] = None
    production_plan_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Consolidated Batch
class ConsolidatedBatchBase(BaseModel):
    product_name: str
    color: str
    total_quantity: int
    order_ids: Optional[str] = None


class ConsolidatedBatchResponse(ConsolidatedBatchBase):
    id: int
    production_plan_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsolidatedBatchWithOrders(ConsolidatedBatchResponse):
    orders: List[SalesOrderResponse] = []


# Production Plan
class ProductionPlanBase(BaseModel):
    planned_date: date
    batch_id: Optional[int] = None
    quantity_planned: int
    status: str = "scheduled"
    machine_id: Optional[int] = None


class ProductionPlanCreate(ProductionPlanBase):
    pass


class ProductionPlanResponse(ProductionPlanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Product & Raw Material
class RawMaterialBase(BaseModel):
    name: str
    unit: str = "kg"


class RawMaterialCreate(RawMaterialBase):
    pass


class RawMaterialResponse(RawMaterialBase):
    id: int

    class Config:
        from_attributes = True


class ProductRawMaterialBase(BaseModel):
    product_id: int
    raw_material_id: int
    quantity_per_unit: float


class ProductRawMaterialCreate(ProductRawMaterialBase):
    pass


class ProductRawMaterialResponse(ProductRawMaterialBase):
    id: int
    raw_material: Optional[RawMaterialResponse] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    raw_materials: List[ProductRawMaterialResponse] = []

    class Config:
        from_attributes = True


# Machine
class MachineBase(BaseModel):
    name: str
    capacity_per_day: int
    is_active: bool = True


class MachineCreate(MachineBase):
    pass


class MachineResponse(MachineBase):
    id: int

    class Config:
        from_attributes = True


# Dashboard & RM Calculator
class RMRequirementItem(BaseModel):
    raw_material_name: str
    unit: str
    quantity_per_unit: float
    total_quantity: float


class BatchRMRequirement(BaseModel):
    batch_id: int
    product_name: str
    color: str
    total_quantity: int
    requirements: List[RMRequirementItem]


class DashboardStats(BaseModel):
    today_plan_count: int
    pending_orders_count: int
    completed_orders_count: int
    delayed_orders_count: int
    today_plan: List[dict]
    pending_orders: List[dict]
    delayed_orders: List[dict]
    today_rm_requirements: List[dict] = []
