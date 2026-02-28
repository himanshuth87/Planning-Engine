"""Raw materials and product-RM mapping API."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import RawMaterial, Product, ProductRawMaterial
from app.schemas import (
    RawMaterialCreate,
    RawMaterialResponse,
    ProductCreate,
    ProductResponse,
    ProductRawMaterialCreate,
    ProductRawMaterialResponse,
    BatchRMRequirement,
)
from app.services.raw_material_calc import get_rm_requirement_for_batch

router = APIRouter(prefix="/raw-materials", tags=["raw-materials"])


@router.get("/materials", response_model=List[RawMaterialResponse])
def list_raw_materials(db: Session = Depends(get_db)):
    return db.query(RawMaterial).all()


@router.post("/materials", response_model=RawMaterialResponse)
def create_raw_material(data: RawMaterialCreate, db: Session = Depends(get_db)):
    rm = RawMaterial(**data.model_dump())
    db.add(rm)
    db.commit()
    db.refresh(rm)
    return rm


@router.get("/products", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.post("/products", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.name == data.name).first():
        raise HTTPException(status_code=400, detail="Product already exists")
    p = Product(name=data.name)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.post("/products/{product_id}/materials", response_model=ProductRawMaterialResponse)
def add_product_material(
    product_id: int,
    data: ProductRawMaterialCreate,
    db: Session = Depends(get_db),
):
    payload = data.model_dump()
    payload["product_id"] = product_id
    prm = ProductRawMaterial(**payload)
    db.add(prm)
    db.commit()
    db.refresh(prm)
    return prm


@router.get("/batch/{batch_id}/requirement", response_model=BatchRMRequirement)
def batch_requirement(batch_id: int, db: Session = Depends(get_db)):
    req = get_rm_requirement_for_batch(db, batch_id)
    if not req:
        raise HTTPException(status_code=404, detail="Batch not found")
    return req
