"""Raw materials and product-RM mapping API."""
from typing import List
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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


@router.post("/upload-bom")
async def upload_bom(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = file.filename.lower()
    if not (ext.endswith(".xlsx") or ext.endswith(".xls") or ext.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Please upload an Excel or CSV file")
    content = await file.read()
    try:
        if ext.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {str(e)}")
        
    required = {"Product Name", "Raw Material", "Unit", "Quantity Per Unit"}
    cols = set(df.columns)
    if not required.issubset(cols):
        raise HTTPException(
            status_code=400,
            detail=f"Required columns: {required}. Found: {list(cols)}",
        )
        
    created = 0
    errors = []
    
    for _, row in df.iterrows():
        try:
            prod_name = row.get("Product Name")
            rm_name = row.get("Raw Material")
            unit = row.get("Unit")
            qty = row.get("Quantity Per Unit")
            
            if pd.isna(prod_name) or pd.isna(rm_name) or pd.isna(qty):
                continue
                
            prod_name = str(prod_name).strip()
            rm_name = str(rm_name).strip()
            unit = str(unit).strip() if not pd.isna(unit) else "kg"
            qty = float(qty)
            
            if qty <= 0:
                errors.append(f"Invalid quantity {qty} for {prod_name}")
                continue
                
            # Get or create Product
            product = db.query(Product).filter(Product.name == prod_name).first()
            if not product:
                product = Product(name=prod_name)
                db.add(product)
                db.flush()
                
            # Get or create RawMaterial
            rm = db.query(RawMaterial).filter(RawMaterial.name == rm_name).first()
            if not rm:
                rm = RawMaterial(name=rm_name, unit=unit)
                db.add(rm)
                db.flush()
                
            # Check existing mapping
            existing_prm = db.query(ProductRawMaterial).filter(
                ProductRawMaterial.product_id == product.id,
                ProductRawMaterial.raw_material_id == rm.id
            ).first()
            
            if existing_prm:
                # Update existing BOM
                existing_prm.quantity_per_unit = qty
            else:
                # Create new BOM
                prm = ProductRawMaterial(
                    product_id=product.id,
                    raw_material_id=rm.id,
                    quantity_per_unit=qty
                )
                db.add(prm)
                created += 1
                
        except Exception as e:
            errors.append(f"Row {prod_name if 'prod_name' in dir() else 'Unknown'}: {e}")
            
    db.commit()
    return {"created_or_updated": created, "errors": errors}


@router.get("/batch/{batch_id}/requirement", response_model=BatchRMRequirement)
def batch_requirement(batch_id: int, db: Session = Depends(get_db)):
    req = get_rm_requirement_for_batch(db, batch_id)
    if not req:
        raise HTTPException(status_code=404, detail="Batch not found")
    return req
