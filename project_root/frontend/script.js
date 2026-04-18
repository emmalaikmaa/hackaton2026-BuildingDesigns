// ====================================================
// TARTU AJALOOMAJAD · PEASKRIPT
// ====================================================
// See fail sisaldab kogu loogikat:
//   - kaardi loomine
//   - markerite (pin-ide) lisamine
//   - ajariba ja filtreerimine
// Andmed tulevad failist data.js (muutuja houses)
// ====================================================
 
 
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
 
  // Pildi stiil (päris pilt või placeholder gradient)
  const gradient = placeholderGradients[house.id % placeholderGradients.length];
  const imageStyle = house.image
    ? "background-image: url('${house.image}')"
    : 'background: ${gradient};';
 
  // Tagid
  const waterTag = house.water
    ? '<span class="tag has-water">vesi ✓</span>'
    : '<span class="tag">vesi ✗</span>';
 
  const demolishedTag = house.demolished
    ? `<span class="tag">lammutatud ${house.demolished}</span>`
    : '<span class="tag">säilinud</span>';
 
  // Popup sisu
  const popupContent = `
    <div class="popup-image" style="${imageStyle}"></div>
    <div class="popup-body">
      <div class="popup-address">${house.address}</div>
      <div class="popup-year">ehitatud ${house.built}</div>
      <div class="popup-info">${house.info}</div>
      <div class="popup-tags">
        ${waterTag}
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
  const showWater = document.getElementById('filter-water').checked;
  const showNoWater = document.getElementById('filter-no-water').checked;
 
  let visibleCount = 0;
 
  markers.forEach(m => {
    const h = m.houseData;
    // Kas maja eksisteerib valitud aastal?
    const existsInYear = h.built <= currentYear &&
                         (h.demolished === null || h.demolished >= currentYear);
    // Kas maja vastab filtrile?
    const matchesFilter = (h.water && showWater) || (!h.water && showNoWater);
 
    if (existsInYear && matchesFilter) {
      if (!map.hasLayer(m)) m.addTo(map);
      visibleCount++;
    } else {
      if (map.hasLayer(m)) map.removeLayer(m);
    }
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
document.getElementById('filter-water').addEventListener('change', updateVisibleMarkers);
document.getElementById('filter-no-water').addEventListener('change', updateVisibleMarkers);
 
 
// ---- ALGNE KUVAMINE ----
updateVisibleMarkers();