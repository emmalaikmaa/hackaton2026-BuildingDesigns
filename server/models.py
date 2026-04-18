from sqlalchemy import Column, Integer, Text, Numeric, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base

class Building(Base):
    __tablename__ = "hooned"

    id                   = Column(Integer, primary_key=True)
    failid               = Column(Text)
    linn                 = Column(Text)
    tanav                = Column(Text)
    tanav_uus            = Column(Text)
    maja_nr_uus          = Column(Text)
    otstarve             = Column(Text)
    valisseina_materjal  = Column(Text)
    ##korruseid_uues       = Column(Numeric) TBA
    projekti_kuupaev     = Column(Date)
    lat                  = Column(Float)
    lng                  = Column(Float)

    owners = relationship("Owner", secondary="hooned_omanikud", back_populates="buildings")

class JunctionTable(Base):
    __tablename__ = "hooned_omanikud"

    hoone_id   = Column(Integer, ForeignKey("hooned.id"), primary_key=True)
    inimene_id = Column(Integer, ForeignKey("omanikud.inimene_id"), primary_key=True)

class Owner(Base):
    __tablename__ = "omanikud"

    inimene_id    = Column(Integer, primary_key=True)
    eesnimi       = Column(Text)
    isanimi       = Column(Text)
    perenimi      = Column(Text)
    amet          = Column(Text)
    sugu          = Column(Text)
    asutus        = Column(Text)
    omanik_1940   = Column(Text)
    kelle_parijad = Column(Text)

    buildings = relationship("Building", secondary="hooned_omanikud", back_populates="owners")