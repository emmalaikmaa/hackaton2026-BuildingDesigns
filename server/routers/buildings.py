from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from server.database import get_db
from server.models import Building
from server.schemas import BuildingPin, BuildingDetail, OwnerDetail

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("/", response_model=list[BuildingPin])
def get_buildings(db: Session = Depends(get_db)):
    """
    Tagastab KÕIK koordinaatidega hooned kaardile.
    Kerge variant - ainult need väljad mida frontend filtreerimiseks vajab.
    Detailne info tuleb GET /buildings/{id} päringus.
    """
    return db.query(Building).filter(
        Building.latitude.isnot(None),
        Building.longitude.isnot(None),
    ).all()


@router.get("/{building_id}", response_model=BuildingDetail)
def get_building(building_id: int, request: Request, db: Session = Depends(get_db)):
    """Ühe hoone detailne info koos omanikega ja piltide URL-idega."""
    building = (
        db.query(Building)
        .options(joinedload(Building.owners))
        .filter(Building.id == building_id)
        .first()
    )
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # 'failid' on andmebaasis sõne (komadega), schema ootab list'i
    failid_list = []
    schematic_urls = []
    if building.failid:
        failid_list = [f.strip() for f in building.failid.split(",") if f.strip()]
        schematic_urls = [
            f"{request.base_url}pildid/{f}" for f in failid_list
        ]

    # Ehita BuildingDetail käsitsi (et failid oleks list)
    result = BuildingDetail(
        id=building.id,
        failid=failid_list,
        schematic_urls=schematic_urls,
        linn=building.linn,
        tanav=building.tanav,
        linnaosa=building.linnaosa,
        tanav_uus=building.tanav_uus,
        maja_nr_uus=building.maja_nr_uus,
        kinnistu_nr=building.kinnistu_nr,
        otstarve=building.otstarve,
        valisseina_materjal=building.valisseina_materjal,
        vaheseina_materjal=building.vaheseina_materjal,
        kuivkaimla=building.kuivkaimla,
        vesi=building.vesi,
        korruseid_vanas=building.korruseid_vanas,
        korruseid_uues=building.korruseid_uues,
        kortereid_1_vanas=building.kortereid_1_vanas,
        kortereid_1_uues=building.kortereid_1_uues,
        kortereid_2_vanas=building.kortereid_2_vanas,
        kortereid_2_uues=building.kortereid_2_uues,
        kortereid_3_uues=building.kortereid_3_uues,
        kortereid_4_uues=building.kortereid_4_uues,
        kortereid_5_vanas=building.kortereid_5_vanas,
        kortereid_5_uues=building.kortereid_5_uues,
        kortereid_6_vanas=building.kortereid_6_vanas,
        kortereid_6_uues=building.kortereid_6_uues,
        kortereid_7_vanas=building.kortereid_7_vanas,
        kortereid_7_uues=building.kortereid_7_uues,
        kortereid_8_vanas=building.kortereid_8_vanas,
        kortereid_8_uues=building.kortereid_8_uues,
        kortereid_9_vanas=building.kortereid_9_vanas,
        kortereid_9_uues=building.kortereid_9_uues,
        kortereid_10_vanas=building.kortereid_10_vanas,
        kortereid_10_uues=building.kortereid_10_uues,
        kortereid_rohkem_kui_10_vanas=building.kortereid_rohkem_kui_10_vanas,
        kortereid_rohkem_kui_10_uues=building.kortereid_rohkem_kui_10_uues,
        projekti_nr=building.projekti_nr,
        projekti_kuupaev=building.projekti_kuupaev,
        projekti_kinnitamise_kuupaev=building.projekti_kinnitamise_kuupaev,
        fondi_nimi=building.fondi_nimi,
        aadress=building.aadress,
        latitude=building.latitude,
        longitude=building.longitude,
        owners=[OwnerDetail.model_validate(o) for o in building.owners],
    )

    return result