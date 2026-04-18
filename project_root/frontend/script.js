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

const currentMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
});


// Vanaaegne kaart: Tartu linna plaan 1927
const oldMap1927 = L.tileLayer.wms('https://xgis.maaamet.ee/xgis2/service/1h2s3j9?fbclid=IwY2xjawRQc_5leHRuA2FlbQIxMABicmlkETB1RndxaTYyZW5qYUdueE1Yc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHuf2HbwskTAgYRlIBT1WhtiLLqpq2ku64H0Qpj3dqOnweB6_ip5Ath2sI4KS_aem_yKzMWBOeHPxu4rEITsOkbg', {
  layers: 'tartu_plaan_1927',
  format: 'image/png',
  transparent: false,
  attribution: 'Maa- ja Ruumiamet / Rahvusarhiiv'
});

currentMap.addTo(map);


const historicMapSelect = document.getElementById('historic-map-select');


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

/**
 * Leiab hoone kategooria otstarbe teksti järgi.
 * Kontrollitakse spetsiifilisemast üldisemani — esimene vaste võidab.
 */
function getCategory(otstarve) {
  if (!otstarve) return 'muu';
  const o = otstarve.toLowerCase();

  // Kool / haridus (enne kiriku, sest "seminar" ja "kirikukool" kattuvad)
  if (o.includes('kool') || o.includes('gümnaasium') || o.includes('seminar') ||
      o.includes('ülikool') || o.includes('lasteaed') || o.includes('haridus'))
    return 'kool';

  // Kirik / usuhoone
  if (o.includes('kirik') || o.includes('kabel') || o.includes('sünagoog') ||
      o.includes('palvela'))
    return 'kirik';

  // Haigla / meditsiin
  if (o.includes('haigla') || o.includes('kliinik') || o.includes('apteek') ||
      o.includes('ambulat') || o.includes('sanitaar'))
    return 'haigla';

  // Pood / kauplus
  if (o.includes('pood') || o.includes('kauplus') || o.includes('laat') ||
      o.includes('äri') || o.includes('ladu') || o.includes('magasin'))
    return 'pood';

  // Tehas / tööstus
  if (o.includes('tehas') || o.includes('vabrik') || o.includes('töökoda') ||
      o.includes('veski') || o.includes('tööstus'))
    return 'tehas';

  // Ait / salvestus
  if (o.includes('ait') || o.includes('kelder') || o.includes('salv'))
    return 'ait';

  // Saun
  if (o.includes('saun') || o.includes('pesemaja'))
    return 'saun';

  // Pesuköök (enne "köök" üldist, enne elamut)
  if (o.includes('pesuköök') || o.includes('pesukook'))
    return 'pesukook';

  // Tall / loomapidamine
  if (o.includes('tall') || o.includes('laut') || o.includes('sigala') ||
      o.includes('kanala'))
    return 'tall';

  // Kuur
  if (o.includes('kuur'))
    return 'kuur';

  // Elamu (viimaseks, sest nt "elumaja" võib teistes koosseisus esineda)
  if (o.includes('elamu') || o.includes('elumaja'))
    return 'elamu';

  return 'muu';
}


/**
 * SVG ikoonid kategooriate jaoks.
 * Igaüks on valge viewBox 0 0 24 24, täidab kõik pin keskse osa.
 */
const CATEGORY_ICONS = {
  elamu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>`,

  kuur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6 8 6"/><path d="M5 11v9h14v-9"/><rect x="10" y="13" width="4" height="7"/></svg>`,

  pesukook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="5"/><rect x="4" y="5" width="16" height="16" rx="1"/><circle cx="7" cy="8" r="0.5" fill="currentColor"/><circle cx="10" cy="8" r="0.5" fill="currentColor"/></svg>`,

  tall: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6v10H3z"/><path d="M10 20v-6h4v6"/><path d="M3 14h18"/></svg>`,

  kool: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,

  kirik: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="9"/><line x1="9" y1="5" x2="15" y2="5"/><path d="M6 10v10h12V10l-6-4z"/></svg>`,

  haigla: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,

  pood: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1.5 12H5.5z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`,

  tehas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20V9l5 3V9l5 3V6l8 14z"/><line x1="7" y1="20" x2="7" y2="16"/><line x1="12" y1="20" x2="12" y2="16"/><line x1="17" y1="20" x2="17" y2="16"/></svg>`,

  ait: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6v10H3z"/><rect x="9" y="13" width="6" height="7"/><line x1="3" y1="14" x2="21" y2="14"/></svg>`,

  saun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14c0-4 4-7 8-7s8 3 8 7"/><path d="M8 10c-1 2-1 4 0 5"/><path d="M12 8c-1 3-1 5 0 7"/><path d="M16 10c1 2 1 4 0 5"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,

  muu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="13"/><line x1="5" y1="11" x2="19" y2="11"/><line x1="12" y1="11" x2="12" y2="20"/></svg>`,
};


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
  const iconSvg = CATEGORY_ICONS[category] || CATEGORY_ICONS.muu;

  const icon = L.divIcon({
    className: '',
    html: `<div class="custom-pin ${pinClass}" data-id="${house.id}">
             <div class="custom-pin-icon">${iconSvg}</div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
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
  // Peida 3D nupp kuniks andmed laetud
  document.getElementById('detail-3d-button').style.display = 'none';

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


// ====================================================
// 3D MUDELI NUPP
// ====================================================

/**
 * Kontrollib kas hoonel on 3D mudel ja näitab vastavat nuppu.
 * Lisa uusi hooneid models3D massiivi.
 */
function setup3DButton(h) {
  const wrapper = document.getElementById('detail-3d-button');
  const btn = document.getElementById('detail-3d-link');

  // 3D mudelite register
  const models3D = [
    {
      match: (building) => {
        const tanav = (building.tanav_uus || building.tanav || '').toLowerCase();
        const nr = String(building.maja_nr_uus || '').trim();
        return tanav.includes('riia') && nr === '53';
      },
      url: 'riia-53-3d.html',
    },
    // Lisa rohkem siia, kui teed neile 3D mudelid:
    // { match: (b) => b.tanav_uus === 'Vanemuise' && b.maja_nr_uus === '10', url: 'vanemuise-10-3d.html' },
  ];

  const model = models3D.find(m => m.match(h));

  if (model) {
    wrapper.style.display = 'block';
    // Eemaldame vanad kuulajad (kloonides nupp) ja paneme uue
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      // window.open() lubab window.close() hiljem töötada
      window.open(model.url, '_blank');
    });
  } else {
    wrapper.style.display = 'none';
  }
}


// ====================================================
// GALERII (pildid) + LIGHTBOX
// ====================================================

let currentGalleryUrls = [];
let currentGalleryIndex = 0;

function buildGallery(urls) {
  const gallery = document.getElementById('detail-gallery');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  gallery.classList.remove('empty');
  urls = urls.map(url => url.replace('.tif', '.jpg'));

  currentGalleryUrls = urls || [];
  currentGalleryIndex = 0;

  if (!urls || urls.length === 0) {
    gallery.classList.add('empty');
    gallery.innerHTML = '<div class="detail-gallery-item" style="cursor: default;"></div>';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }

  // Piltide listid
  const items = urls.map((url, i) =>
    `<div class="detail-gallery-item" style="background-image: url('${url.replace('.tif', '.jpg')}');" data-index="${i}"></div>`
  ).join('');

  gallery.innerHTML = items;

  // Nooled - näita ainult kui mitu pilti
  if (urls.length > 1) {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  // Klikk pildil → lightbox (anname kaasa ka klikitud element)
  gallery.querySelectorAll('.detail-gallery-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      if (!isNaN(idx)) openLightbox(idx, el);
    });
  });

  // Uuenda nupud vastavalt scrolli positsioonile
  updateGalleryArrows();
}

function scrollToGalleryIndex(index) {
  const gallery = document.getElementById('detail-gallery');
  if (!gallery) return;
  const items = gallery.querySelectorAll('.detail-gallery-item');
  if (items[index]) {
    currentGalleryIndex = index;
    gallery.scrollTo({
      left: items[index].offsetLeft,
      behavior: 'smooth',
    });
    updateGalleryArrows();
  }
}

function updateGalleryArrows() {
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  prevBtn.disabled = currentGalleryIndex === 0;
  nextBtn.disabled = currentGalleryIndex >= currentGalleryUrls.length - 1;
}

// Noolenupud galeriis
document.getElementById('gallery-prev').addEventListener('click', () => {
  if (currentGalleryIndex > 0) scrollToGalleryIndex(currentGalleryIndex - 1);
});
document.getElementById('gallery-next').addEventListener('click', () => {
  if (currentGalleryIndex < currentGalleryUrls.length - 1)
    scrollToGalleryIndex(currentGalleryIndex + 1);
});

// Jälgi käsitsi scroll'imist, uuenda index
document.getElementById('detail-gallery').addEventListener('scroll', (e) => {
  const gallery = e.target;
  const itemWidth = gallery.offsetWidth;
  const newIndex = Math.round(gallery.scrollLeft / itemWidth);
  if (newIndex !== currentGalleryIndex) {
    currentGalleryIndex = newIndex;
    updateGalleryArrows();
  }
});


// ====================================================
// LIGHTBOX (FLIP tehnika - sujuv zoom animatsioon)
// ====================================================

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');
let lightboxIndex = 0;
let sourceElement = null;

function openLightbox(index, clickedElement) {
  if (!currentGalleryUrls || currentGalleryUrls.length === 0) return;
  lightboxIndex = index;
  sourceElement = clickedElement;

  const url = currentGalleryUrls[index];

  lightboxImg.classList.remove('animate');
  lightboxImg.src = url;
  lightbox.classList.add('open');
  lightbox.classList.remove('ready');

  const startAnimation = () => {
    const sourceRect = clickedElement.getBoundingClientRect();
    const targetRect = lightboxImg.getBoundingClientRect();

    if (targetRect.width === 0 || targetRect.height === 0) {
      requestAnimationFrame(startAnimation);
      return;
    }

    const scaleX = sourceRect.width / targetRect.width;
    const scaleY = sourceRect.height / targetRect.height;
    const translateX = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
    const translateY = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);

    lightboxImg.style.transform =
      `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;

    lightboxImg.offsetHeight;

    requestAnimationFrame(() => {
      lightboxImg.classList.add('animate');
      lightboxImg.style.transform = 'translate(-50%, -50%)';

      setTimeout(() => {
        lightbox.classList.add('ready');
      }, 350);
    });
  };

  if (lightboxImg.complete && lightboxImg.naturalWidth > 0) {
    requestAnimationFrame(startAnimation);
  } else {
    lightboxImg.onload = () => {
      requestAnimationFrame(startAnimation);
    };
  }

  updateLightboxCounter();
  updateLightboxArrows();
}

function closeLightbox() {
  if (!lightbox.classList.contains('open')) return;

  lightbox.classList.remove('ready');
  lightbox.classList.add('closing');

  if (!sourceElement) {
    lightbox.classList.remove('open', 'closing');
    lightboxImg.classList.remove('animate');
    lightboxImg.style.transform = 'translate(-50%, -50%)';
    lightboxImg.src = '';
    return;
  }

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = lightboxImg.getBoundingClientRect();

  const scaleX = sourceRect.width / targetRect.width;
  const scaleY = sourceRect.height / targetRect.height;
  const translateX = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
  const translateY = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);

  lightboxImg.classList.add('animate');

  requestAnimationFrame(() => {
    lightboxImg.style.transform =
      `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  });

  setTimeout(() => {
    lightbox.classList.remove('open', 'closing');
    lightboxImg.classList.remove('animate');
    lightboxImg.style.transform = 'translate(-50%, -50%)';
    lightboxImg.src = '';
    sourceElement = null;
  }, 350);
}

function switchLightboxImage(newIndex) {
  lightboxIndex = newIndex;
  const url = currentGalleryUrls[newIndex];

  lightboxImg.classList.remove('animate');
  lightboxImg.src = url;

  const gallery = document.getElementById('detail-gallery');
  const items = gallery.querySelectorAll('.detail-gallery-item');
  if (items[newIndex]) {
    sourceElement = items[newIndex];
    scrollToGalleryIndex(newIndex);
  }

  updateLightboxCounter();
  updateLightboxArrows();
}

function lightboxPrev() {
  if (lightboxIndex > 0) switchLightboxImage(lightboxIndex - 1);
}

function lightboxNext() {
  if (lightboxIndex < currentGalleryUrls.length - 1) switchLightboxImage(lightboxIndex + 1);
}

function updateLightboxCounter() {
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${currentGalleryUrls.length}`;
  lightboxCounter.style.display = currentGalleryUrls.length > 1 ? 'block' : 'none';
}

function updateLightboxArrows() {
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  prevBtn.style.display = currentGalleryUrls.length > 1 ? 'flex' : 'none';
  nextBtn.style.display = currentGalleryUrls.length > 1 ? 'flex' : 'none';
  prevBtn.disabled = lightboxIndex === 0;
  nextBtn.disabled = lightboxIndex >= currentGalleryUrls.length - 1;
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
document.getElementById('lightbox-img').addEventListener('click', closeLightbox);

document.getElementById('lightbox-prev').addEventListener('click', (e) => {
  e.stopPropagation();
  lightboxPrev();
});
document.getElementById('lightbox-next').addEventListener('click', (e) => {
  e.stopPropagation();
  lightboxNext();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});


// ====================================================
// DETAILPANEELI TÄITMINE
// ====================================================

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
    const validOwners = h.owners
      .map(o => {
        const nimi = [o.eesnimi, o.isanimi, o.perenimi]
          .filter(Boolean).join(' ');

        const displayName = nimi || o.asutus || '';
        if (!displayName) return null;

        const meta = [];
        if (o.amet) meta.push(o.amet);
        if (o.sugu) meta.push(o.sugu);
        if (o.asutus && nimi) meta.push(o.asutus);

        const metaHtml = meta.length
          ? `<div class="detail-owner-meta">${meta.join(' · ')}</div>` : '';
        return `
          <div class="detail-owner">
            <div class="detail-owner-name">${displayName}</div>
            ${metaHtml}
          </div>
        `;
      })
      .filter(Boolean);

    if (validOwners.length > 0) {
      parts.push(`
        <div class="detail-field">
          <div class="detail-field-label">Omanikud</div>
          <div class="detail-owners-list">${validOwners.join('')}</div>
        </div>
      `);
    }
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

  // Korruste arv
  const kvanas = h.korruseid_vanas ? parseFloat(h.korruseid_vanas) : null;
  const kuues = h.korruseid_uues ? parseFloat(h.korruseid_uues) : null;
  if (kvanas !== null || kuues !== null) {
    const korrusedItems = [];
    if (kvanas !== null) {
      korrusedItems.push(`
        <div class="detail-korrused-item">
          <div class="detail-korrused-label">Vana</div>
          <div class="detail-korrused-value">${kvanas}</div>
        </div>
      `);
    }
    if (kuues !== null) {
      korrusedItems.push(`
        <div class="detail-korrused-item">
          <div class="detail-korrused-label">Uus</div>
          <div class="detail-korrused-value">${kuues}</div>
        </div>
      `);
    }
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Korruste arv</div>
        <div class="detail-korrused">${korrusedItems.join('')}</div>
      </div>
    `);
  }

  // Tubade arv
  const roomRows = [];
  const roomLabels = [
    ['kortereid_1', '1-toalisi'],
    ['kortereid_2', '2-toalisi'],
    ['kortereid_3', '3-toalisi'],
    ['kortereid_4', '4-toalisi'],
    ['kortereid_5', '5-toalisi'],
    ['kortereid_6', '6-toalisi'],
    ['kortereid_7', '7-toalisi'],
    ['kortereid_8', '8-toalisi'],
    ['kortereid_9', '9-toalisi'],
    ['kortereid_10', '10-toalisi'],
    ['kortereid_rohkem_kui_10', 'Rohkem kui 10-toalisi'],
  ];

  roomLabels.forEach(([prefix, label]) => {
    const vanas = h[`${prefix}_vanas`];
    const uues = h[`${prefix}_uues`];
    const vanasNum = vanas ? parseFloat(vanas) : null;
    const uuesNum = uues ? parseFloat(uues) : null;

    if (vanasNum === null && uuesNum === null) return;

    const items = [];
    if (vanasNum !== null) {
      items.push(`
        <div class="detail-korrused-item">
          <div class="detail-korrused-label">${label} (vana)</div>
          <div class="detail-korrused-value">${vanasNum}</div>
        </div>
      `);
    }
    if (uuesNum !== null) {
      items.push(`
        <div class="detail-korrused-item">
          <div class="detail-korrused-label">${label} (uus)</div>
          <div class="detail-korrused-value">${uuesNum}</div>
        </div>
      `);
    }

    roomRows.push(`
      <div class="detail-korrused" style="margin-bottom: 10px;">
        ${items.join('')}
      </div>
    `);
  });

  if (roomRows.length > 0) {
    parts.push(`
      <div class="detail-field">
        <div class="detail-field-label">Korterite jaotus tubade arvu järgi</div>
        ${roomRows.join('')}
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

  // 3D mudeli nupp - kontrolli kas sellel hoonel on 3D mudel
  setup3DButton(h);
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

  if (f.kuivkaimla) {
    if (f.kuivkaimla === '__puudub__') {
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
// KAARDI VAHETUS
// ====================================================

function switchBaseMap(value) {
  if (value === 'current') {
    if (map.hasLayer(oldMap1927)) {
      map.removeLayer(oldMap1927);
    }
  }

  if (value === 'historic') {
    if (!map.hasLayer(oldMap1927)) {
      oldMap1927.addTo(map);
    }
  }
}

historicMapSelect.addEventListener('change', (e) => {
  switchBaseMap(e.target.value);
});

switchBaseMap(historicMapSelect.value);


// ====================================================
// AJARIBA
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
// LEGENDI EHITAMINE
// ====================================================

function buildLegend() {
  const categories = [
    { key: 'elamu',    label: 'Elamu' },
    { key: 'kuur',     label: 'Kuur' },
    { key: 'pesukook', label: 'Pesuköök' },
    { key: 'tall',     label: 'Tall' },
    { key: 'kool',     label: 'Kool' },
    { key: 'kirik',    label: 'Kirik' },
    { key: 'haigla',   label: 'Haigla' },
    { key: 'pood',     label: 'Pood' },
    { key: 'tehas',    label: 'Tehas' },
    { key: 'ait',      label: 'Ait' },
    { key: 'saun',     label: 'Saun' },
    { key: 'muu',      label: 'Muu' },
  ];

  const container = document.getElementById('legend-container');
  container.innerHTML = categories.map(c => `
    <div class="legend-item">
      <span class="legend-pin pin-${c.key}">${CATEGORY_ICONS[c.key]}</span>
      ${c.label}
    </div>
  `).join('');
}


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
  buildLegend();  // Ehita legend kohe (ei oota hoonete laadimist)
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