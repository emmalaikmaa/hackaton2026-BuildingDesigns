from pydantic import BaseModel
from datetime import date

class OwnerDetail(BaseModel):
    inimene_id: int
    eesnimi: str | None
    isanimi: str | None
    perenimi: str | None
    amet: str | None

    class Config:
        from_attributes = True

class BuildingPin(BaseModel):
    id: int
    lat: float
    lng: float

    class Config:
        from_attributes = True

class BuildingDetail(BaseModel):
    id: int
    fail: str | None
    tanav_uus: str | None
    maja_nr_uus: str | None
    linn: str | None
    otstarve: str | None
    valisseina_materjal: str | None
    #korruseid_uues: float | None TBA
    projekti_kuupaev: date | None
    lat: float | None
    lng: float | None
    owners: list[OwnerDetail] = []

    class Config:
        from_attributes = True