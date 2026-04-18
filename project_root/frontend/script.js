// ====================================================
// TARTU AJALOOMAJAD · PEASKRIPT
// Laeb andmed backendist: http://localhost:8000
// ====================================================

const API_BASE = "http://localhost:8000";
const TARTU_KESKLINN = [58.3801, 26.7225];

// Globaalsed andmed
let allHouses = [];                  // kõik majad backendist
const markerById = new Map();        // id -> marker
let currentYear = 1900;


// ====================================================
// KAARDI LOOMINE
// ====================================================

const map = L.map('map', {
  center: TARTU_KESKLINN,
  zoom: 14,
  zoomControl: true,
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
}).addTo(map);

// Marker cluster - rühmitab pin-id kui neid on palju samas kohas
const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  disableClusteringAtZoom: 17,
});
map.addLayer(clusterGroup);


// ====================================================
// HTTP PÄRINGUD BACKENDILE
// ====================================================

async function fetchAllHouses() {
  const response = await fetch(`${API_BASE}/buildings/`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

async function fetchHouseDetails(id) {
  const response = await fetch(`${API_BASE}/buildings/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}


// ====================================================
// MARKERITE LOOMINE
// ====================================================

function createMarker(house) {
  // Vesi: "on" või "oma pumbajaam" = sinine, muidu punane
  const hasWater = house.vesi === 'on' || house.vesi === 'oma pumbajaam';
  const pinClass = hasWater ? 'pin-water' : 'pin-standard';

  const icon = L.divIcon({
    className: '',
    html: `<div class="custom-pin ${pinClass}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });

  const marker = L.marker(
    [parseFloat(house.latitude), parseFloat(house.longitude)],
    { icon }
  );
  marker.houseData = house;

  // Esialgu tühi popup - täidetakse vajutamisel
  marker.bindPopup('<div class="popup-loading">Laadime...</div>', {
    maxWidth: 320,
  });

  // Kui kasutaja avab popup'i, laadime detailid backendist
  marker.on('popupopen', async () => {
    try {
      const details = await fetchHouseDetails(house.id);
      marker.setPopupContent(buildPopupContent(details));
    } catch (error) {
      marker.setPopupContent(
        `<div class="popup-loading" style="color: var(--accent);">
          Tõrge: ${error.message}
        </div>`
      );
    }
  });

  return marker;
}


// ====================================================
// POPUP SISU
// ====================================================

function buildPopupContent(h) {
  // Aadress - eelistame 'tanav_uus' + 'maja_nr_uus'
  const aadress = [h.tanav_uus || h.tanav, h.maja_nr_uus]
    .filter(Boolean)
    .join(' ') || 'Tundmatu aadress';

  // Aasta projektist
  const aasta = h.projekti_kuupaev
    ? h.projekti_kuupaev.substring(0, 4)
    : '?';

  // Tagid
  const tagid = [];
  const hasWater = h.vesi === 'on' || h.vesi === 'oma pumbajaam';
  if (h.vesi) {
    tagid.push(
      `<span class="tag ${hasWater ? 'has-water' : ''}">vesi: ${h.vesi}</span>`
    );
  }
  if (h.kuivkaimla) tagid.push(`<span class="tag">käimla: ${h.kuivkaimla}</span>`);
  if (h.otstarve) tagid.push(`<span class="tag">${h.otstarve}</span>`);
  if (h.valisseina_materjal) tagid.push(`<span class="tag">väliss.: ${h.valisseina_materjal}</span>`);
  if (h.vaheseina_materjal) tagid.push(`<span class="tag">vahes.: ${h.vaheseina_materjal}</span>`);

  // Pilt (kui on schematic_urls tagastatud)
  let pildiHtml = '';
  if (h.schematic_urls && h.schematic_urls.length > 0) {
    pildiHtml = `<div class="popup-image" style="background-image: url('${h.schematic_urls[0]}');"></div>`;
  } else {
    pildiHtml = `<div class="popup-image" style="background: linear-gradient(135deg, #8b7355, #c4a57a);"></div>`;
  }

  // Korruste arv (Numeric/Decimal tuleb sõnena - "2.00")
  let korrusedHtml = '';
  const kvanas = h.korruseid_vanas ? parseFloat(h.korruseid_vanas) : null;
  const kuues = h.korruseid_uues ? parseFloat(h.korruseid_uues) : null;
  if (kvanas !== null || kuues !== null) {
    korrusedHtml = `<div class="popup-info">Korruseid: ${kvanas ?? '?'} → ${kuues ?? '?'}</div>`;
  }

  // Omanikud
  let omanikudHtml = '';
  if (h.owners && h.owners.length > 0) {
    const list = h.owners.map(o => {
      const nimi = [o.eesnimi, o.isanimi, o.perenimi]
        .filter(Boolean)
        .join(' ');
      const amet = o.amet ? ` (${o.amet})` : '';
      return `<div>${nimi || '?'}${amet}</div>`;
    }).join('');
    omanikudHtml = `
      <div class="popup-section">
        <div class="popup-section-title">Omanikud</div>
        <div class="popup-info">${list}</div>
      </div>
    `;
  }

  return `
    ${pildiHtml}
    <div class="popup-body">
      <div class="popup-address">${aadress}</div>
      <div class="popup-year">projekt ${aasta} · linnaosa ${h.linnaosa || '?'}</div>
      ${korrusedHtml}
      <div class="popup-tags">${tagid.join('')}</div>
      ${omanikudHtml}
    </div>
  `;
}


// ====================================================
// FILTREERIMINE
// ====================================================

function getFilters() {
  return {
    vesi: document.getElementById('filter-vesi').value,
    kuivkaimla: document.getElementById('filter-kuivkaimla').value,
    otstarve: document.getElementById('filter-otstarve').value.trim().toLowerCase(),
    valisseina: document.getElementById('filter-valisseina').value,
    vaheseina: document.getElementById('filter-vaheseina').value,
    tanav: document.getElementById('filter-tanav').value.trim().toLowerCase(),
    linnaosa: document.getElementById('filter-linnaosa').value,
  };
}

function houseMatchesFilters(h, f, year) {
  // 1. Aasta filter (projekti_kuupaev <= valitud aasta)
  if (h.projekti_kuupaev) {
    const houseYear = parseInt(h.projekti_kuupaev.substring(0, 4));
    if (houseYear > year) return false;
  }

  // 2. Vesi
  if (f.vesi && h.vesi !== f.vesi) return false;

  // 3. Kuivkäimla
  if (f.kuivkaimla && h.kuivkaimla !== f.kuivkaimla) return false;

  // 4. Otstarve (osaline vaste)
  if (f.otstarve) {
    if (!h.otstarve || !h.otstarve.toLowerCase().includes(f.otstarve)) return false;
  }

  // 5. Välisseina materjal
  if (f.valisseina && h.valisseina_materjal !== f.valisseina) return false;

  // 6. Vaheseina materjal
  if (f.vaheseina && h.vaheseina_materjal !== f.vaheseina) return false;

  // 7. Tänav (osaline vaste)
  if (f.tanav) {
    if (!h.tanav_uus || !h.tanav_uus.toLowerCase().includes(f.tanav)) return false;
  }

  // 8. Linnaosa (Numeric tuleb sõnena nt "1.0", "2.0"...)
  if (f.linnaosa) {
    if (parseFloat(h.linnaosa) !== parseFloat(f.linnaosa)) return false;
  }

  return true;
}

function updateVisibleMarkers() {
  const filters = getFilters();
  let visibleCount = 0;
  const matching = [];

  // Eemaldame kõik markerid
  clusterGroup.clearLayers();

  // Kogume sobivad markerid
  allHouses.forEach(h => {
    if (houseMatchesFilters(h, filters, currentYear)) {
      const marker = markerById.get(h.id);
      if (marker) {
        matching.push(marker);
        visibleCount++;
      }
    }
  });

  // Lisame kõik korraga (kiirem)
  clusterGroup.addLayers(matching);

  document.getElementById('visible-count').textContent = visibleCount.toLocaleString('et-EE');
  document.getElementById('year-display').textContent = currentYear;
}


// ====================================================
// AJARIBA
// ====================================================

const slider = document.getElementById('slider');
noUiSlider.create(slider, {
  start: [1900],
  connect: [true, false],
  range: { min: 1870, max: 1940 },
  step: 1,
  tooltips: true,
  format: {
    to: v => Math.round(v),
    from: v => Number(v),
  },
  pips: {
    mode: 'values',
    values: [1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940],
    density: 5,
  },
});

slider.noUiSlider.on('update', (values) => {
  currentYear = parseInt(values[0]);
  if (allHouses.length > 0) updateVisibleMarkers();
});


// ====================================================
// FILTRITE KUULAJAD
// ====================================================

const filterIds = [
  'filter-vesi',
  'filter-kuivkaimla',
  'filter-otstarve',
  'filter-valisseina',
  'filter-vaheseina',
  'filter-tanav',
  'filter-linnaosa',
];

filterIds.forEach(id => {
  const el = document.getElementById(id);
  const eventType = el.type === 'text' ? 'input' : 'change';
  el.addEventListener(eventType, updateVisibleMarkers);
});

document.getElementById('reset-filters').addEventListener('click', () => {
  filterIds.forEach(id => {
    document.getElementById(id).value = '';
  });
  updateVisibleMarkers();
});


// ====================================================
// LAADIMINE JA VEAD
// ====================================================

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showError(msg) {
  hideLoading();
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').style.display = 'block';
}


// ====================================================
// KÄIVITUS
// ====================================================

async function init() {
  console.log('Laadime hooneid backendist...');
  try {
    allHouses = await fetchAllHouses();
    console.log(`Laetud ${allHouses.length} hoonet`);

    // Loome markerid kõigi majade jaoks
    allHouses.forEach(h => {
      const marker = createMarker(h);
      markerById.set(h.id, marker);
    });

    // Statistika - kokku andmebaasis
    document.getElementById('total-count').textContent =
      allHouses.length.toLocaleString('et-EE');

    // Filtreerimine + kaardile lisamine
    updateVisibleMarkers();

    hideLoading();
  } catch (error) {
    console.error('Viga laadimisel:', error);
    showError(error.message);
  }
}

// Käivita!
init();