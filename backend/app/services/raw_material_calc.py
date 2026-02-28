"""Raw material calculation per batch."""
from typing import List

from sqlalchemy.orm import Session
from app.models import ConsolidatedBatch, ProductRawMaterial, Product, RawMaterial, ProductionPlan
from app.schemas import BatchRMRequirement, RMRequirementItem


def get_rm_requirement_for_batch(db: Session, batch_id: int) -> BatchRMRequirement | None:
    batch = db.query(ConsolidatedBatch).filter(ConsolidatedBatch.id == batch_id).first()
    if not batch:
        return None

    product = db.query(Product).filter(Product.name == batch.product_name).first()
    if not product:
        return BatchRMRequirement(
            batch_id=batch.id,
            product_name=batch.product_name,
            color=batch.color,
            total_quantity=batch.total_quantity,
            requirements=[],
        )

    requirements = []
    for prm in product.raw_materials:
        total = prm.quantity_per_unit * batch.total_quantity
        requirements.append(
            RMRequirementItem(
                raw_material_name=prm.raw_material.name,
                unit=prm.raw_material.unit,
                quantity_per_unit=prm.quantity_per_unit,
                total_quantity=round(total, 2),
            )
        )
    return BatchRMRequirement(
        batch_id=batch.id,
        product_name=batch.product_name,
        color=batch.color,
        total_quantity=batch.total_quantity,
        requirements=requirements,
    )


def get_rm_requirements_for_plans(db: Session, plan_ids: List[int]) -> List[BatchRMRequirement]:
    result = []
    seen = set()
    for pid in plan_ids:
        plan = db.query(ProductionPlan).filter(ProductionPlan.id == pid).first()
        if not plan or plan.batch_id is None or plan.batch_id in seen:
            continue
        seen.add(plan.batch_id)
        req = get_rm_requirement_for_batch(db, plan.batch_id)
        if req:
            result.append(req)
    return result
