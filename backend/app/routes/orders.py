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
    if db.query(SalesOrder).filter(
        SalesOrder.order_id == data.order_id,
        SalesOrder.product_name == data.product_name,
        SalesOrder.color == data.color
    ).first():
        raise HTTPException(status_code=400, detail="Line item for this order already exists")
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
    required = {"Order ID", "Product Name", "Quantity", "Color"}
    cols = set(df.columns)
    if not required.issubset(cols):
        raise HTTPException(
            status_code=400,
            detail=f"Required columns: {required}. Found: {list(cols)}",
        )
    created = 0
    errors = []
    seen_in_batch = set()
    for _, row in df.iterrows():
        try:
            if pd.isna(row["Order ID"]):
                continue
            order_id = str(row["Order ID"]).strip()
            if not order_id:
                continue

            color = row["Color"]
            color_str = "Default" if pd.isna(color) else str(color).strip()
            
            prod_name = row["Product Name"]
            prod_name_str = "Unknown" if pd.isna(prod_name) else str(prod_name).strip()

            line_key = (order_id, prod_name_str, color_str)
            if line_key in seen_in_batch or db.query(SalesOrder).filter(
                SalesOrder.order_id == order_id,
                SalesOrder.product_name == prod_name_str,
                SalesOrder.color == color_str
            ).first():
                errors.append(f"Duplicate Line: {order_id} ({prod_name_str} - {color_str})")
                continue
                
            seen_in_batch.add(line_key)

            delivery_val = row.get("Delivery Date")
            if pd.isna(delivery_val) or not delivery_val:
                delivery = date.today()
            elif hasattr(delivery_val, "date"):
                delivery = delivery_val.date()
            elif isinstance(delivery_val, str):
                try:
                    delivery = date.fromisoformat(delivery_val[:10])
                except Exception:
                    delivery = date.today()
            else:
                delivery = date.today()

            qty = row["Quantity"]
            qty_int = 0 if pd.isna(qty) else int(float(qty))

            order = SalesOrder(
                order_id=order_id,
                product_name=prod_name_str,
                quantity=qty_int,
                color=color_str,
                delivery_date=delivery,
            )
            db.add(order)
            created += 1
        except Exception as e:
            errors.append(f"Row {order_id if 'order_id' in dir() else row.get('Order ID')}: {e}")
    db.commit()
    return {"created": created, "errors": errors}


@router.get("/{id}", response_model=SalesOrderResponse)
def get_order(id: int, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{id}/status")
def update_order_status(id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.id == id).first()
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


@router.delete("/{id}")
def delete_order(id: int, db: Session = Depends(get_db)):
    order = db.query(SalesOrder).filter(SalesOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"ok": True}
