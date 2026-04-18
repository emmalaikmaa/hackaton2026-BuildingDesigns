// ====================================================
// TARTU AJALOOMAJAD · ANDMEBAAS
// ====================================================
//
// Iga maja kirjeldus:
//   id:           unikaalne number
//   address:      aadress (sõne)
//   street:       tänava nimi (filtreerimiseks)
//   district:     linnaosa
//   lat, lng:     koordinaadid
//   built:        ehitusaasta
//   demolished:   lammutamise aasta, või null kui alles
//   water:        veevarustus (true/false)
//   outhouse:     kuivkäimla ('sees' / 'väljas' / 'puudub')
//   purpose:      otstarve ('korter' / 'elumaja' / 'kuur')
//   wallMaterial: siseseina materjal ('puit' / 'kivi')
//   rooms:        tubade arv (1-10)
//   owner:        omaniku nimi
//   info:         kirjeldus popup'i jaoks
//   image:        pildi URL või null
// ====================================================
 
const houses = [
  {
    id: 1,
    address: "Rüütli 12",
    street: "Rüütli",
    district: "Kesklinn",
    lat: 58.3801, lng: 26.7225,
    built: 1878, demolished: null,
    water: true,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "puit",
    rooms: 5,
    owner: "Jaan Tamm",
    info: "Kaupmehe elumaja, kahekorruseline puitehitis kivitrepiga.",
    image: null
  },
  {
    id: 2,
    address: "Ülikooli 8",
    street: "Ülikooli",
    district: "Kesklinn",
    lat: 58.3805, lng: 26.7210,
    built: 1885, demolished: null,
    water: true,
    outhouse: "sees",
    purpose: "korter",
    wallMaterial: "kivi",
    rooms: 8,
    owner: "Eduard Müller",
    info: "Neorenessanss-stiilis üürimaja, arhitekt R. von Engelhardti töö.",
    image: null
  },
  {
    id: 3,
    address: "Küütri 3",
    street: "Küütri",
    district: "Kesklinn",
    lat: 58.3795, lng: 26.7230,
    built: 1892, demolished: 1944,
    water: false,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "puit",
    rooms: 3,
    owner: "Mart Kask",
    info: "Puidust elamu, hävis Teises maailmasõjas pommitamisel.",
    image: null
  },
  {
    id: 4,
    address: "Vanemuise 21",
    street: "Vanemuise",
    district: "Kesklinn",
    lat: 58.3778, lng: 26.7185,
    built: 1903, demolished: null,
    water: true,
    outhouse: "sees",
    purpose: "korter",
    wallMaterial: "kivi",
    rooms: 6,
    owner: "Liisa Kuusk",
    info: "Juugendstiilis kivimaja, arhitekt G. Hellati projekti järgi.",
    image: null
  },
  {
    id: 5,
    address: "Kompanii 7",
    street: "Kompanii",
    district: "Kesklinn",
    lat: 58.3815, lng: 26.7245,
    built: 1875, demolished: 1930,
    water: false,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "puit",
    rooms: 4,
    owner: "Peeter Saar",
    info: "Vana puitelamu, lammutati uue korterelamu rajamiseks.",
    image: null
  },
  {
    id: 6,
    address: "Jakobi 14",
    street: "Jakobi",
    district: "Kesklinn",
    lat: 58.3820, lng: 26.7200,
    built: 1890, demolished: null,
    water: true,
    outhouse: "sees",
    purpose: "korter",
    wallMaterial: "kivi",
    rooms: 7,
    owner: "Karl Lepp",
    info: "Ülikooli lähedane üüriline hoone.",
    image: null
  },
  {
    id: 7,
    address: "Pepleri 9",
    street: "Pepleri",
    district: "Tähtvere",
    lat: 58.3770, lng: 26.7215,
    built: 1898, demolished: null,
    water: false,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "puit",
    rooms: 2,
    owner: "Anna Mets",
    info: "Väike puithoone, algselt käsitöölise elumaja.",
    image: null
  },
  {
    id: 8,
    address: "Tiigi 28",
    street: "Tiigi",
    district: "Tähtvere",
    lat: 58.3760, lng: 26.7190,
    built: 1912, demolished: null,
    water: true,
    outhouse: "sees",
    purpose: "korter",
    wallMaterial: "kivi",
    rooms: 9,
    owner: "Jüri Pärn",
    info: "Eklektilise fassaadiga kivihoone, ehitatud enne Esimest maailmasõda.",
    image: null
  },
  {
    id: 9,
    address: "Lai 23",
    street: "Lai",
    district: "Kesklinn",
    lat: 58.3840, lng: 26.7235,
    built: 1880, demolished: null,
    water: false,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "kivi",
    rooms: 5,
    owner: "Toomas Vaher",
    info: "Kaupmehe maja koos laoruumiga siseõues.",
    image: null
  },
  {
    id: 10,
    address: "Näituse 2",
    street: "Näituse",
    district: "Tähtvere",
    lat: 58.3785, lng: 26.7165,
    built: 1920, demolished: null,
    water: true,
    outhouse: "sees",
    purpose: "elumaja",
    wallMaterial: "kivi",
    rooms: 4,
    owner: "Helmi Tamm",
    info: "Iseseisvusaegne elamu, funktsionalistlikud jooned.",
    image: null
  },
  {
    id: 11,
    address: "Kastani 42",
    street: "Kastani",
    district: "Karlova",
    lat: 58.3750, lng: 26.7130,
    built: 1905, demolished: null,
    water: true,
    outhouse: "väljas",
    purpose: "elumaja",
    wallMaterial: "puit",
    rooms: 6,
    owner: "Aleksander Ojamaa",
    info: "Kahekorruseline puitmaja rõduga, Tartu eeslinnastumise näide.",
    image: null
  },
  {
    id: 12,
    address: "Veski 16",
    street: "Veski",
    district: "Supilinn",
    lat: 58.3825, lng: 26.7180,
    built: 1889, demolished: 1965,
    water: false,
    outhouse: "väljas",
    purpose: "kuur",
    wallMaterial: "puit",
    rooms: 1,
    owner: "Mihkel Rebane",
    info: "Vanalinna ääres paiknenud töölisperede majake. Lammutatud nõukogudeaegse elamurajooni ehituseks.",
    image: null
  },
];