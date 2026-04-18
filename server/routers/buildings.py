from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Building
from server.schemas import BuildingDetail

router = APIRouter(prefix="/buildings", tags=["buildings"])

@router.get("/", response_model=list[BuildingDetail])
def get_buildings(db: Session = Depends(get_db)):
    return db.query(Building).filter(
        Building.latitude.isnot(None),
        Building.longitude.isnot(None)
    ).limit(400).all()

@router.get("/{building_id}", response_model=BuildingDetail)
def get_building(building_id: int, request: Request, db: Session = Depends(get_db)):
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    result = BuildingDetail.model_validate(building)
    if building.failid:
        result.schematic_urls = [
            str(request.base_url) + f"pildid/{filename.strip()}"
            for filename in building.failid.split(",")
        ]

    return result