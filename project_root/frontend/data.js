// ====================================================
// TARTU AJALOOMAJAD · ANDMEBAAS
// ====================================================
//
// Iga maja kirjeldus:
//   id:          unikaalne number
//   address:     aadress (sõne)
//   lat, lng:    koordinaadid (laiuskraad, pikkuskraad)
//   built:       ehitusaasta (number)
//   demolished:  lammutamise aasta, või null kui alles
//   water:       kas majal on veevarustus (true/false)
//   info:        lühike kirjeldus popup'i jaoks
//   image:       pildi URL või null (null = kasutatakse placeholder'it)
//
// UUTE MAJADE LISAMISEKS: lihtsalt lisa uus objekt massiivi.
// ====================================================
 
const houses = [
  {
    id: 1,
    address: "Rüütli 12",
    lat: 58.3801,
    lng: 26.7225,
    built: 1878,
    demolished: null,
    water: true,
    info: "Kaupmehe elumaja, kahekorruseline puitehitis kivitrepiga. Üks vanemaid säilinud hooneid tänaval.",
    image: null
  },
  {
    id: 2,
    address: "Ülikooli 8",
    lat: 58.3805,
    lng: 26.7210,
    built: 1885,
    demolished: null,
    water: true,
    info: "Neorenessanss-stiilis üürimaja, kuulus arhitekt R. von Engelhardti töö.",
    image: null
  },
  {
    id: 3,
    address: "Küütri 3",
    lat: 58.3795,
    lng: 26.7230,
    built: 1892,
    demolished: 1944,
    water: false,
    info: "Puidust elamu, hävis Teises maailmasõjas toimunud pommitamisel.",
    image: null
  },
  {
    id: 4,
    address: "Vanemuise 21",
    lat: 58.3778,
    lng: 26.7185,
    built: 1903,
    demolished: null,
    water: true,
    info: "Juugendstiilis kivimaja, ehitatud arhitekt G. Hellati projekti järgi.",
    image: null
  },
  {
    id: 5,
    address: "Kompanii 7",
    lat: 58.3815,
    lng: 26.7245,
    built: 1875,
    demolished: 1930,
    water: false,
    info: "Vana puitelamu, lammutati uue korterelamu rajamiseks.",
    image: null
  },
  {
    id: 6,
    address: "Jakobi 14",
    lat: 58.3820,
    lng: 26.7200,
    built: 1890,
    demolished: null,
    water: true,
    info: "Ülikooli lähedane üüriline hoone.",
    image: null
  },
  {
    id: 7,
    address: "Pepleri 9",
    lat: 58.3770,
    lng: 26.7215,
    built: 1898,
    demolished: null,
    water: false,
    info: "Väike puithoone, algselt käsitöölise elumaja.",
    image: null
  },
  {
    id: 8,
    address: "Tiigi 28",
    lat: 58.3760,
    lng: 26.7190,
    built: 1912,
    demolished: null,
    water: true,
    info: "Eklektilise fassaadiga kivihoone, ehitatud enne Esimest maailmasõda.",
    image: null
  },
  {
    id: 9,
    address: "Lai 23",
    lat: 58.3840,
    lng: 26.7235,
    built: 1880,
    demolished: null,
    water: false,
    info: "Kaupmehe maja koos laoruumiga siseõues.",
    image: null
  },
  {
    id: 10,
    address: "Näituse 2",
    lat: 58.3785,
    lng: 26.7165,
    built: 1920,
    demolished: null,
    water: true,
    info: "Iseseisvusaegne elamu, funktsionalistlikud jooned.",
    image: null
  },
  {
    id: 11,
    address: "Kastani 42",
    lat: 58.3750,
    lng: 26.7130,
    built: 1905,
    demolished: null,
    water: true,
    info: "Kahekorruseline puitmaja rõduga, Tartu eeslinnastumise näide.",
    image: null
  },
  {
    id: 12,
    address: "Veski 16",
    lat: 58.3825,
    lng: 26.7180,
    built: 1889,
    demolished: 1965,
    water: false,
    info: "Vanalinna ääres paiknenud töölisperede majake. Lammutatud nõukogudeaegse elamurajooni ehituseks.",
    image: null
  },
];