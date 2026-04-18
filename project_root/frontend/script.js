// ====================================================
// TARTU AJALOOMAJAD · PEASKRIPT

 
 
// ---- Placeholder pildid (kuni päris pildid puuduvad) ----
const placeholderGradients = [
  "linear-gradient(135deg, #8b7355 0%, #c4a57a 100%)",
  "linear-gradient(135deg, #6b5d4f 0%, #a89684 100%)",
  "linear-gradient(135deg, #8b6f47 0%, #d4b896 100%)",
  "linear-gradient(135deg, #5d4e3a 0%, #9c8670 100%)",
];
 
 
// ---- KAARDI LOOMINE ----
const map = L.map('map', {
  center: [58.3801, 26.7225], // Tartu kesklinn
  zoom: 15,
  zoomControl: true,
});
 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
}).addTo(map);
 
 
// ---- MARKERITE LOOMINE ----
const markers = [];
 
function createPin(house) {
  const pinClass = house.water ? 'pin-water' : 'pin-standard';
 
  const icon = L.divIcon({
    className: '',
    html: `<div class="custom-pin ${pinClass}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
 
  const marker = L.marker([house.lat, house.lng], { icon });
 
  // Pildi stiil
  const gradient = placeholderGradients[house.id % placeholderGradients.length];
  const imageStyle = house.image
    ? "background-image: url('${house.image}')"
    : 'background: ${gradient};';
 
  // Tagid
  const waterTag = house.water
    ? `<span class="tag has-water">vesi ✓</span>`
    : `<span class="tag">vesi ✗</span>`;
 
  const demolishedTag = house.demolished
    ? `<span class="tag">lammutatud ${house.demolished}</span>`
    : `<span class="tag">säilinud</span>`;
 
  const purposeTag = `<span class="tag">${house.purpose}</span>`;
  const materialTag = `<span class="tag">${house.wallMaterial}</span>`;
 
  // Popup sisu
  const popupContent = `
    <div class="popup-image" style="${imageStyle}"></div>
    <div class="popup-body">
      <div class="popup-address">${house.address}</div>
      <div class="popup-year">ehitatud ${house.built} · ${house.district}</div>
      <div class="popup-info">${house.info}</div>
      <div class="popup-info" style="font-size: 12px; margin-bottom: 10px;">
        Omanik: <em>${house.owner}</em> · ${house.rooms} tuba · kuivkäimla ${house.outhouse}
      </div>
      <div class="popup-tags">
        ${waterTag}
        ${purposeTag}
        ${materialTag}
        ${demolishedTag}
      </div>
    </div>
  `;
 
  marker.bindPopup(popupContent, {
    closeButton: true,
    maxWidth: 280,
  });
 
  marker.houseData = house;
  return marker;
}
 
// Loo marker iga maja jaoks
houses.forEach(h => {
  const m = createPin(h);
  markers.push(m);
});
 
 
// ---- FILTREERIMINE ----
let currentYear = 1900;
 
function updateVisibleMarkers() {
  // Loe filtrite väärtused
  const onlyWater = document.getElementById('filter-water').checked;
  const outhouse = document.getElementById('filter-outhouse').value;
  const purpose = document.getElementById('filter-purpose').value;
  const material = document.getElementById('filter-material').value;
  const rooms = document.getElementById('filter-rooms').value;
  const owner = document.getElementById('filter-owner').value.trim().toLowerCase();
  const street = document.getElementById('filter-street').value.trim().toLowerCase();
  const district = document.getElementById('filter-district').value;
 
  let visibleCount = 0;
 
  markers.forEach(m => {
    const h = m.houseData;
 
    // 1. Aasta kontroll
    const existsInYear = h.built <= currentYear &&
                         (h.demolished === null || h.demolished >= currentYear);
    if (!existsInYear) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
 
    // 2. Kõik filtrid (AND-loogika - kõik peavad sobima)
    if (onlyWater && !h.water) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (outhouse && h.outhouse !== outhouse) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (purpose && h.purpose !== purpose) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (material && h.wallMaterial !== material) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (rooms && h.rooms !== parseInt(rooms)) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (owner && !h.owner.toLowerCase().includes(owner)) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (street && !h.street.toLowerCase().includes(street)) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
    if (district && h.district !== district) {
      if (map.hasLayer(m)) map.removeLayer(m);
      return;
    }
 
    // Maja vastab kõigile filtritele - näita
    if (!map.hasLayer(m)) m.addTo(map);
    visibleCount++;
  });
 
  document.getElementById('visible-count').textContent = visibleCount;
  document.getElementById('year-display').textContent = currentYear;
}
 
 
// ---- AJARIBA ----
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
  updateVisibleMarkers();
});
 
 
// ---- FILTRITE KUULAJAD ----
const filterIds = [
  'filter-water',
  'filter-outhouse',
  'filter-purpose',
  'filter-material',
  'filter-rooms',
  'filter-owner',
  'filter-street',
  'filter-district',
];
 
filterIds.forEach(id => {
  const el = document.getElementById(id);
  // Checkbox/select kasutavad 'change', text input 'input' (et reageeriks tippimisele)
  const eventType = el.type === 'text' ? 'input' : 'change';
  el.addEventListener(eventType, updateVisibleMarkers);
});
 
 
// ---- LÄHTESTA NUPP ----
document.getElementById('reset-filters').addEventListener('click', () => {
  document.getElementById('filter-water').checked = false;
  document.getElementById('filter-outhouse').value = '';
  document.getElementById('filter-purpose').value = '';
  document.getElementById('filter-material').value = '';
  document.getElementById('filter-rooms').value = '';
  document.getElementById('filter-owner').value = '';
  document.getElementById('filter-street').value = '';
  document.getElementById('filter-district').value = '';
  updateVisibleMarkers();
});
 
 
// ---- ALGNE KUVAMINE ----
updateVisibleMarkers();