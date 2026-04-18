from sqlalchemy import Column, Integer, Text, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base

class Building(Base):
    __tablename__ = "hooned"

    id                              = Column(Integer, primary_key=True)
    failid                          = Column(Text, nullable=False)
    linn                            = Column(Text)
    tanav                           = Column(Text)
    linnaosa                        = Column(Numeric)
    tanav_uus                       = Column(Text)
    maja_nr_uus                     = Column(Text)
    kinnistu_nr                     = Column(Text)
    otstarve                        = Column(Text)
    valisseina_materjal             = Column(Text)
    vaheseina_materjal              = Column(Text)
    kuivkaimla                      = Column(Text)
    vesi                            = Column(Text)
    korruseid_vanas                 = Column(Numeric)
    korruseid_uues                  = Column(Numeric)
    kortereid_1_vanas               = Column(Numeric)
    kortereid_1_uues                = Column(Numeric)
    kortereid_2_vanas               = Column(Numeric)
    kortereid_2_uues                = Column(Numeric)
    kortereid_3_uues                = Column(Numeric)
    kortereid_4_uues                = Column(Numeric)
    kortereid_5_vanas               = Column(Numeric)
    kortereid_5_uues                = Column(Numeric)
    kortereid_6_vanas               = Column(Numeric)
    kortereid_6_uues                = Column(Numeric)
    kortereid_7_vanas               = Column(Numeric)
    kortereid_7_uues                = Column(Numeric)
    kortereid_8_vanas               = Column(Numeric)
    kortereid_8_uues                = Column(Numeric)
    kortereid_9_vanas               = Column(Numeric)
    kortereid_9_uues                = Column(Numeric)
    kortereid_10_vanas              = Column(Numeric)
    kortereid_10_uues               = Column(Numeric)
    kortereid_rohkem_kui_10_vanas   = Column(Numeric)
    kortereid_rohkem_kui_10_uues    = Column(Numeric)
    projekti_nr                     = Column(Text)
    projekti_kuupaev                = Column(Date)
    projekti_kinnitamise_kuupaev    = Column(Date)
    fondi_nimi                      = Column(Text)
    aadress                         = Column(Text)
    latitude                        = Column(Numeric)
    longitude                       = Column(Numeric)

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