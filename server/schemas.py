from pydantic import BaseModel
from datetime import date
from decimal import Decimal


class BuildingPin(BaseModel):
    """
    Kerge info kaardi pin-i jaoks.
    Tagastatakse GET /buildings/ päringus - ainult väljad,
    mida frontend vajab kaardi kuvamiseks ja filtreerimiseks.
    """
    id: int
    latitude: Decimal
    longitude: Decimal
    projekti_kuupaev: date | None = None
    linnaosa: Decimal | None = None
    tanav_uus: str | None = None
    otstarve: str | None = None
    valisseina_materjal: str | None = None
    vaheseina_materjal: str | None = None
    kuivkaimla: str | None = None
    vesi: str | None = None

    class Config:
        from_attributes = True


class OwnerDetail(BaseModel):
    inimene_id: int
    eesnimi: str | None = None
    isanimi: str | None = None
    perenimi: str | None = None
    amet: str | None = None
    sugu: str | None = None
    asutus: str | None = None
    omanik_1940: str | None = None
    kelle_parijad: str | None = None

    class Config:
        from_attributes = True


class BuildingDetail(BaseModel):
    """
    Kogu detailne info ühe hoone kohta (popup'i jaoks).
    Tagastatakse GET /buildings/{id} päringus.
    """
    id: int
    failid: list[str] = []
    linn: str | None = None
    tanav: str | None = None
    linnaosa: Decimal | None = None
    tanav_uus: str | None = None
    maja_nr_uus: str | None = None
    kinnistu_nr: str | None = None
    otstarve: str | None = None
    valisseina_materjal: str | None = None
    vaheseina_materjal: str | None = None
    kuivkaimla: str | None = None
    vesi: str | None = None
    korruseid_vanas: Decimal | None = None
    korruseid_uues: Decimal | None = None
    kortereid_1_vanas: Decimal | None = None
    kortereid_1_uues: Decimal | None = None
    kortereid_2_vanas: Decimal | None = None
    kortereid_2_uues: Decimal | None = None
    kortereid_3_uues: Decimal | None = None
    kortereid_4_uues: Decimal | None = None
    kortereid_5_vanas: Decimal | None = None
    kortereid_5_uues: Decimal | None = None
    kortereid_6_vanas: Decimal | None = None
    kortereid_6_uues: Decimal | None = None
    kortereid_7_vanas: Decimal | None = None
    kortereid_7_uues: Decimal | None = None
    kortereid_8_vanas: Decimal | None = None
    kortereid_8_uues: Decimal | None = None
    kortereid_9_vanas: Decimal | None = None
    kortereid_9_uues: Decimal | None = None
    kortereid_10_vanas: Decimal | None = None
    kortereid_10_uues: Decimal | None = None
    kortereid_rohkem_kui_10_vanas: Decimal | None = None
    kortereid_rohkem_kui_10_uues: Decimal | None = None
    projekti_nr: str | None = None
    projekti_kuupaev: date | None = None
    projekti_kinnitamise_kuupaev: date | None = None
    fondi_nimi: str | None = None
    aadress: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    schematic_urls: list[str] = []
    owners: list[OwnerDetail] = []

    class Config:
        from_attributes = True