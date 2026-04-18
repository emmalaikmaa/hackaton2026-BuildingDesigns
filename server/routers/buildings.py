from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Building
from server.schemas import BuildingPin, BuildingDetail

router = APIRouter(prefix="/buildings", tags=["buildings"])

@router.get("/", response_model=list[BuildingPin])
def get_buildings(
    year_before: int,
    year_after: int,
    db: Session = Depends(get_db)
):
    q = db.query(Building).filter(
        Building.lat.isnot(None),
        Building.lng.isnot(None)
    )
    if year_before: q = q.filter(Building.projekti_kuupaev < f"{year_before}-01-01")
    if year_after:  q = q.filter(Building.projekti_kuupaev > f"{year_after}-12-31")

    return q.with_entities(Building.id, Building.lat, Building.lng).all()

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