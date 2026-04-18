from pydantic import BaseModel
from datetime import date
from decimal import Decimal

class OwnerDetail(BaseModel):
    inimene_id: int
    eesnimi: str | None
    isanimi: str | None
    perenimi: str | None
    amet: str | None
    sugu: str | None
    asutus: str | None
    omanik_1940: str | None
    kelle_parijad: str | None

    class Config:
        from_attributes = True

class BuildingDetail(BaseModel):
    id: int
    failid: list[str] = []
    linn: str | None
    tanav: str | None
    linnaosa: Decimal | None
    tanav_uus: str | None
    maja_nr_uus: str | None
    kinnistu_nr: str | None
    otstarve: str | None
    valisseina_materjal: str | None
    vaheseina_materjal: str | None
    kuivkaimla: str | None
    vesi: str | None
    korruseid_vanas: Decimal | None
    korruseid_uues: Decimal | None
    kortereid_1_vanas: Decimal | None
    kortereid_1_uues: Decimal | None
    kortereid_2_vanas: Decimal | None
    kortereid_2_uues: Decimal | None
    kortereid_3_uues: Decimal | None
    kortereid_4_uues: Decimal | None
    kortereid_5_vanas: Decimal | None
    kortereid_5_uues: Decimal | None
    kortereid_6_vanas: Decimal | None
    kortereid_6_uues: Decimal | None
    kortereid_7_vanas: Decimal | None
    kortereid_7_uues: Decimal | None
    kortereid_8_vanas: Decimal | None
    kortereid_8_uues: Decimal | None
    kortereid_9_vanas: Decimal | None
    kortereid_9_uues: Decimal | None
    kortereid_10_vanas: Decimal | None
    kortereid_10_uues: Decimal | None
    kortereid_rohkem_kui_10_vanas: Decimal | None
    kortereid_rohkem_kui_10_uues: Decimal | None
    projekti_nr: str | None
    projekti_kuupaev: date | None
    projekti_kinnitamise_kuupaev: date | None
    fondi_nimi: str | None
    lat: float | None
    lng: float | None
    schematic_url: list[str] = []
    owners: list[OwnerDetail] = []

    class Config:
        from_attributes = True