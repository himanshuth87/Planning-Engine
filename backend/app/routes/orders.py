"""Sales orders API: CRUD + Excel upload."""
from datetime import date
from typing import List
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SalesOrder
from app.schemas import SalesOrderCreate, SalesOrderResponse
from app.services.consolidation import consolidate_orders

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=List[SalesOrderResponse])
def list_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(SalesOrder).order_by(SalesOrder.delivery_date)
    if status:
        q = q.filter(SalesOrder.status == status)
    return q.all()


@router.post("/", response_model=SalesOrderResponse)
def create_order(data: SalesOrderCreate, db: Session = Depends(get_db)):
    if db.query(SalesOrder).filter(SalesOrder.order_id == data.order_id).first():
        raise HTTPException(status_code=400, detail="Order ID already exists")
    order = SalesOrder(**data.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = file.filename.lower()
    if not (ext.endswith(".xlsx") or ext.endswith(".xls") or ext.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Please upload an Excel (.xlsx, .xls) or CSV file")
    content = await file.read()
    try:
        if ext.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {str(e)}")
    required = {"Order ID", "Product Name", "Quantity", "Color", "Delivery Date"}
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
            order_id = str(row["Order ID"]).strip()
            if not order_id or pd.isna(order_id):
                continue
            if db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first():
                errors.append(f"Duplicate Order ID: {order_id}")
                continue
            delivery = row["Delivery Date"]
            if hasattr(delivery, "date"):
                delivery = delivery.date()
            elif isinstance(delivery, str):
                delivery = date.fromisoformat(delivery[:10])
            order = SalesOrder(
                order_id=order_id,
                product_name=str(row["Product Name"]).strip(),
                quantity=int(float(row["Quantity"])),
                color=str(row["Color"]).strip(),
                delivery_date=delivery,
            )
            db.add(order)
            created += 1
        except Exception as e:
            errors.append(f"Row {order_id if 'order_id' in dir() else row.get('Order ID')}: {e}")
    db.commit()
    return {"created": created, "errors": errors}


@router.get("/{order_id}", response_model=SalesOrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status")
def update_order_status(order_id: str, status: str, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    db.refresh(order)
    return order


@router.delete("/all")
def delete_all_orders(db: Session = Depends(get_db)):
    db.query(SalesOrder).delete()
    db.commit()
    return {"ok": True}


@router.delete("/{order_id}")
def delete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"ok": True}
