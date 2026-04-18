// ====================================================
// TARTU AJALOOMAJAD · PEASKRIPT
// ====================================================

const API_BASE = "http://localhost:8000";
const TARTU_KESKLINN = [58.3801, 26.7225];

let allHouses = [];
const markerById = new Map();
let currentYear = 1900;
let ownerMatchIds = null;
let ownerSearchTimer = null;
let activeMarker = null;  // praegu avatud pin


// ====================================================
// KAART
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
// KATEGOORIAD
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
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return await response.json();
}

async function fetchHouseDetails(id) {
  const response = await fetch(`${API_BASE}/buildings/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return await response.json();
}

async function searchByOwner(name) {
  const response = await fetch(
    `${API_BASE}/buildings/search/owners?name=${encodeURIComponent(name)}`
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return new Set(data.building_ids);
}


// ====================================================
// MARKERID
// ====================================================

function createMarker(house) {
  const category = getCategory(house.otstarve);
  const pinClass = `pin-${category}`;

  const icon = L.divIcon({
    className: '',
    html: `<div class="custom-pin ${pinClass}" data-id="${house.id}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });

  const marker = L.marker(
    [parseFloat(house.latitude), parseFloat(house.longitude)],
    { icon }
  );
  marker.houseData = house;

  // Klikil avame detailpaneeli (mitte popup'i)
  marker.on('click', () => openDetailPanel(house.id, marker));

  return marker;
}


// ====================================================
// DETAILPANEEL (PAREMALT)
// ====================================================

const panel = document.getElementById('detail-panel');
const app = document.querySelector('.app');

function markMarkerActive(marker) {
  // Kustuta eelmine aktiivne
  if (activeMarker) {
    const prevEl = activeMarker.getElement();
    if (prevEl) {
      const pin = prevEl.querySelector('.custom-pin');
      if (pin) pin.classList.remove('active');
    }
  }
  // Märgi uus aktiivne
  activeMarker = marker;
  if (marker) {
    const el = marker.getElement();
    if (el) {
      const pin = el.querySelector('.custom-pin');
      if (pin) pin.classList.add('active');
    }
  }
}

async function openDetailPanel(id, marker) {
  panel.classList.add('open');
  app.classList.add('detail-open');
  markMarkerActive(marker);

  // Näita laadimist galerii asemel
  document.getElementById('detail-gallery').innerHTML =
    '<div class="detail-gallery-loading">Laadime detaile...</div>';
  document.getElementById('detail-address').textContent = '';
  document.getElementById('detail-year').textContent = '';
  document.getElementById('detail-content').innerHTML = '';

  try {
    const h = await fetchHouseDetails(id);
    fillDetailPanel(h);
  } catch (error) {
    document.getElementById('detail-content').innerHTML =
      `<div class="detail-field"><div class="detail-field-value">Tõrge: ${error.message}</div></div>`;
  }
}

function closeDetailPanel() {
  panel.classList.remove('open');
  app.classList.remove('detail-open');
  markMarkerActive(null);
}

document.getElementById('detail-close').addEventListener('click', closeDetailPanel);


// ====================================================
// DETAILPANEELI SISU ÜLESEHITUS
// ====================================================

function linnaosaNimi(nr) {
  const n = parseFloat(nr);
  if (n === 1) return 'Supilinn + Tähtvere';
  if (n === 2) return 'Kesklinn';
  if (n === 3) return 'Ülejõe + Karlova';
  if (n === 4) return 'Linna äärealad';
  return nr ? `Linnaosa ${nr}` : '—';
}

function buildGallery(urls) {
  const gallery = document.getElementById('detail-gallery');
  gallery.classList.remove('empty');

  if (!urls || urls.length === 0) {
    gallery.classList.add('empty');
    gallery.innerHTML = '<div class="detail-gallery-item"></div>';
    return;
  }

  // Piltide listid
  const items = urls.map(url =>
    `<div class="detail-gallery-item" style="background-image: url('${url}');"></div>`
  ).join('');

  // Punktid kui piltide on rohkem kui 1
  let dots = '';
  if (urls.length > 1) {
    dots = '<div class="detail-gallery-dots">' +
      urls.map(() => '<span class="detail-gallery-dot"></span>').join('') +
      '</div>';
  }

  gallery.innerHTML = items + dots;
}

function fillDetailPanel(h) {
  // Aadress
  const aadress = [h.tanav_uus || h.tanav, h.maja_nr_uus]
    .filter(Boolean).join(' ') || 'Tundmatu aadress';
  document.getElementById('detail-address').textContent = aadress;

  // Aasta + linnaosa
  const aasta = h.projekti_kuupaev ? h.projekti_kuupaev.substring(0, 4) : '—';
  document.getElementById('detail-year').textContent =
    `${aasta} · ${linnaosaNimi(h.linnaosa)}`;

  // Galerii
  buildGallery(h.schematic_urls);

  // Põhiväljad
  const content = document.getElementById('detail-content');
  const parts = [];

  // Omanikud
  if (h.owners && h.owners.length > 0) {
    const list = h.owners.map(o => {
      const nimi = [o.eesnimi, o.isanimi, o.perenimi]
        .filter(Boolean).join(' ') || '—';
      const meta = [];
      if (o.amet) meta.push(o.amet);
      if (o.sugu) meta.push(o.sugu);
      if (o.asutus) meta.push(o.asutus);
      const metaHtml = meta.length
        ? `<div class="detail-owner-meta">${meta.join(' · ')}</div>` : '';
      return `
        <div class="detail-owner">
          <div class="detail-owner-name">${nimi}</div>
          ${metaHtml}
        </div>
      `;
    }).join('');
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Omanikud</div>
        <div class="detail-owners-list">${list}</div>
      </div>
    `);
  }

  // Fondi nimi
  if (h.fondi_nimi) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Fond</div>
        <div class="detail-field-value">${h.fondi_nimi}</div>
      </div>
    `);
  }

  // Korruste arv (kui uus või vana puudu, jäta tühjaks)
  const kvanas = h.korruseid_vanas ? parseFloat(h.korruseid_vanas) : null;
  const kuues = h.korruseid_uues ? parseFloat(h.korruseid_uues) : null;
  if (kvanas !== null || kuues !== null) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Korruste arv</div>
        <div class="detail-korrused">
          <div class="detail-korrused-item">
            <div class="detail-korrused-label">Vana</div>
            <div class="detail-korrused-value">${kvanas !== null ? kvanas : ''}</div>
          </div>
          <div class="detail-korrused-item">
            <div class="detail-korrused-label">Uus</div>
            <div class="detail-korrused-value">${kuues !== null ? kuues : ''}</div>
          </div>
        </div>
      </div>
    `);
  }

  // Kuivkäimla
  parts.push(`
    <div class="detail-field">
      <div class="detail-field-label">Kuivkäimla</div>
      <div class="detail-field-value">${h.kuivkaimla || '<em>puudub</em>'}</div>
    </div>
  `);

  // Vesi
  parts.push(`
    <div class="detail-field">
      <div class="detail-field-label">Vesi</div>
      <div class="detail-field-value">${h.vesi || '<em>puudub</em>'}</div>
    </div>
  `);

  // Otstarve
  if (h.otstarve) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Otstarve</div>
        <div class="detail-field-value">${h.otstarve}</div>
      </div>
    `);
  }

  // Välisseina materjal
  if (h.valisseina_materjal) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Välisseina materjal</div>
        <div class="detail-field-value">${h.valisseina_materjal}</div>
      </div>
    `);
  }

  // Vaheseina materjal
  if (h.vaheseina_materjal) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Vaheseina materjal</div>
        <div class="detail-field-value">${h.vaheseina_materjal}</div>
      </div>
    `);
  }

  content.innerHTML = parts.join('');
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
  if (h.projekti_kuupaev) {
    const houseYear = parseInt(h.projekti_kuupaev.substring(0, 4));
    if (houseYear > year) return false;
  }

  if (ownerMatchIds !== null && !ownerMatchIds.has(h.id)) return false;
  if (f.vesi && h.vesi !== f.vesi) return false;

  // Kuivkäimla - spetsiaalne "puudub" variant
  if (f.kuivkaimla) {
    if (f.kuivkaimla === '__puudub__') {
      // Andmebaasis on see null
      if (h.kuivkaimla) return false;
    } else {
      if (h.kuivkaimla !== f.kuivkaimla) return false;
    }
  }

  if (f.otstarve && (!h.otstarve || !h.otstarve.toLowerCase().includes(f.otstarve))) return false;
  if (f.valisseina && h.valisseina_materjal !== f.valisseina) return false;
  if (f.vaheseina && h.vaheseina_materjal !== f.vaheseina) return false;
  if (f.tanav && (!h.tanav_uus || !h.tanav_uus.toLowerCase().includes(f.tanav))) return false;
  if (f.linnaosa && parseFloat(h.linnaosa) !== parseFloat(f.linnaosa)) return false;

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
// OMANIKU OTSING
// ====================================================

function handleOwnerSearch() {
  const input = document.getElementById('filter-owner');
  const hint = document.getElementById('owner-hint');
  const name = input.value.trim();

  if (ownerSearchTimer) clearTimeout(ownerSearchTimer);

  if (!name) {
    ownerMatchIds = null;
    hint.textContent = '';
    updateVisibleMarkers();
    return;
  }

  if (name.length < 2) {
    hint.textContent = 'Tipi vähemalt 2 tähte...';
    return;
  }

  hint.textContent = 'Otsin...';

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
// AJARIBA — 1870 kuni 1920!
// ====================================================

const slider = document.getElementById('slider');
noUiSlider.create(slider, {
  start: [1900],
  connect: [true, false],
  range: { min: 1870, max: 1920 },
  step: 1,
  tooltips: true,
  format: {
    to: v => Math.round(v),
    from: v => Number(v),
  },
  pips: {
    mode: 'values',
    values: [1870, 1880, 1890, 1900, 1910, 1920],
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
  'filter-vesi', 'filter-kuivkaimla', 'filter-otstarve',
  'filter-valisseina', 'filter-vaheseina', 'filter-tanav', 'filter-linnaosa',
];

filterIds.forEach(id => {
  const el = document.getElementById(id);
  const eventType = el.type === 'text' ? 'input' : 'change';
  el.addEventListener(eventType, updateVisibleMarkers);
});

document.getElementById('filter-owner').addEventListener('input', handleOwnerSearch);

document.getElementById('reset-filters').addEventListener('click', () => {
  filterIds.forEach(id => document.getElementById(id).value = '');
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