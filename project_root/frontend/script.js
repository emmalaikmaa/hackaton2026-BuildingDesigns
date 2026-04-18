// ====================================================
// TARTU AJALOOMAJAD · PEASKRIPT
// ====================================================

const API_BASE = "http://localhost:8000";
const TARTU_KESKLINN = [58.3801, 26.7225];

// Globaalsed andmed
let allHouses = [];
const markerById = new Map();
let currentYear = 1900;
let ownerMatchIds = null;  // null = omaniku filtreid pole; Set<number> = sobivate ID-d

// Debounce timer omaniku otsingule
let ownerSearchTimer = null;


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

const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  disableClusteringAtZoom: 17,
});
map.addLayer(clusterGroup);


// ====================================================
// KATEGOORIAD (otstarbe järgi pin värv)
// ====================================================

function getCategory(otstarve) {
  if (!otstarve) return 'muu';
  const o = otstarve.toLowerCase();

  if (o.includes('elamu')) return 'elamu';
  if (o.includes('kuur')) return 'kuur';
  if (o.includes('pesuköök') || o.includes('pesukook')) return 'pesukook';
  if (o.includes('tall')) return 'tall';
  return 'muu';
}


// ====================================================
// HTTP PÄRINGUD
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

async function searchByOwner(name) {
  const response = await fetch(
    `${API_BASE}/buildings/search/owners?name=${encodeURIComponent(name)}`
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return new Set(data.building_ids);
}


// ====================================================
// MARKERITE LOOMINE
// ====================================================

function createMarker(house) {
  const category = getCategory(house.otstarve);
  const pinClass = `pin-${category}`;

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

  marker.bindPopup('<div class="popup-loading">Laadime...</div>', {
    maxWidth: 320,
  });

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
  const aadress = [h.tanav_uus || h.tanav, h.maja_nr_uus]
    .filter(Boolean)
    .join(' ') || 'Tundmatu aadress';

  const aasta = h.projekti_kuupaev
    ? h.projekti_kuupaev.substring(0, 4)
    : '?';

  const tagid = [];
  if (h.vesi) tagid.push(`<span class="tag">vesi: ${h.vesi}</span>`);
  if (h.kuivkaimla) tagid.push(`<span class="tag">käimla: ${h.kuivkaimla}</span>`);
  if (h.otstarve) tagid.push(`<span class="tag">${h.otstarve}</span>`);
  if (h.valisseina_materjal) tagid.push(`<span class="tag">väliss.: ${h.valisseina_materjal}</span>`);
  if (h.vaheseina_materjal) tagid.push(`<span class="tag">vahes.: ${h.vaheseina_materjal}</span>`);

  let pildiHtml = '';
  if (h.schematic_urls && h.schematic_urls.length > 0) {
    pildiHtml = `<div class="popup-image" style="background-image: url('${h.schematic_urls[0]}');"></div>`;
  } else {
    pildiHtml = `<div class="popup-image" style="background: linear-gradient(135deg, #8b7355, #c4a57a);"></div>`;
  }

  let korrusedHtml = '';
  const kvanas = h.korruseid_vanas ? parseFloat(h.korruseid_vanas) : null;
  const kuues = h.korruseid_uues ? parseFloat(h.korruseid_uues) : null;
  if (kvanas !== null || kuues !== null) {
    korrusedHtml = `<div class="popup-info">Korruseid: ${kvanas ?? '?'} → ${kuues ?? '?'}</div>`;
  }

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
  // 1. Aasta filter
  if (h.projekti_kuupaev) {
    const houseYear = parseInt(h.projekti_kuupaev.substring(0, 4));
    if (houseYear > year) return false;
  }

  // 2. Omanik (backend päringuga tulemus)
  if (ownerMatchIds !== null && !ownerMatchIds.has(h.id)) return false;

  // 3. Vesi
  if (f.vesi && h.vesi !== f.vesi) return false;

  // 4. Kuivkäimla
  if (f.kuivkaimla && h.kuivkaimla !== f.kuivkaimla) return false;

  // 5. Otstarve (osaline vaste)
  if (f.otstarve) {
    if (!h.otstarve || !h.otstarve.toLowerCase().includes(f.otstarve)) return false;
  }

  // 6. Välisseina materjal
  if (f.valisseina && h.valisseina_materjal !== f.valisseina) return false;

  // 7. Vaheseina materjal
  if (f.vaheseina && h.vaheseina_materjal !== f.vaheseina) return false;

  // 8. Tänav (osaline vaste)
  if (f.tanav) {
    if (!h.tanav_uus || !h.tanav_uus.toLowerCase().includes(f.tanav)) return false;
  }

  // 9. Linnaosa
  if (f.linnaosa) {
    if (parseFloat(h.linnaosa) !== parseFloat(f.linnaosa)) return false;
  }

  return true;
}

function updateVisibleMarkers() {
  const filters = getFilters();
  let visibleCount = 0;
  const matching = [];

  clusterGroup.clearLayers();

  allHouses.forEach(h => {
    if (houseMatchesFilters(h, filters, currentYear)) {
      const marker = markerById.get(h.id);
      if (marker) {
        matching.push(marker);
        visibleCount++;
      }
    }
  });

  clusterGroup.addLayers(matching);

  document.getElementById('visible-count').textContent = visibleCount.toLocaleString('et-EE');
  document.getElementById('year-display').textContent = currentYear;
}


// ====================================================
// OMANIKU OTSING (debounced)
// ====================================================

function handleOwnerSearch() {
  const input = document.getElementById('filter-owner');
  const hint = document.getElementById('owner-hint');
  const name = input.value.trim();

  // Tühista eelmine pärimise ootamine
  if (ownerSearchTimer) clearTimeout(ownerSearchTimer);

  // Kui tühi, võta filter maha
  if (!name) {
    ownerMatchIds = null;
    hint.textContent = '';
    updateVisibleMarkers();
    return;
  }

  // Liiga lühike - ära ülekoorma backendi
  if (name.length < 2) {
    hint.textContent = 'Tipi vähemalt 2 tähte...';
    return;
  }

  hint.textContent = 'Otsin...';

  // Oota 400ms enne päringut (kui kasutaja lõpetab tippimise)
  ownerSearchTimer = setTimeout(async () => {
    try {
      ownerMatchIds = await searchByOwner(name);
      hint.textContent = `Leitud ${ownerMatchIds.size} hoonet`;
      updateVisibleMarkers();
    } catch (error) {
      hint.textContent = `Viga: ${error.message}`;
      ownerMatchIds = null;
    }
  }, 400);
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

// Omanik kuulatakse eraldi (tal on debouncing)
document.getElementById('filter-owner').addEventListener('input', handleOwnerSearch);

document.getElementById('reset-filters').addEventListener('click', () => {
  filterIds.forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('filter-owner').value = '';
  document.getElementById('owner-hint').textContent = '';
  ownerMatchIds = null;
  updateVisibleMarkers();
});


// ====================================================
// LAADIMINE
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

    allHouses.forEach(h => {
      const marker = createMarker(h);
      markerById.set(h.id, marker);
    });

    document.getElementById('total-count').textContent =
      allHouses.length.toLocaleString('et-EE');

    updateVisibleMarkers();
    hideLoading();
  } catch (error) {
    console.error('Viga laadimisel:', error);
    showError(error.message);
  }
}

init();