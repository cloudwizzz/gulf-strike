// ─── TIDES ───────────────────────────────────────────────
async function loadTides() {
  try {
    const res = await fetch('/api/tides');
    const data = await res.json();
    const predictions = data.predictions || [];
    const container = document.getElementById('tide-data');
    if (predictions.length === 0) {
      container.innerHTML = '<p style="color:#ff8a65">Could not load tide data.</p>';
      return;
    }
    container.innerHTML = predictions.map(p => `
      <div class="tide-item">
        <span class="${p.type === 'H' ? 'tide-high' : 'tide-low'}">
          ${p.type === 'H' ? '▲ High' : '▼ Low'} Tide
        </span>
        <span>${p.t.split(' ')[1]}</span>
        <span>${parseFloat(p.v).toFixed(1)} ft</span>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('tide-data').innerHTML = '<p style="color:#ff8a65">Tide data unavailable.</p>';
  }
}

// ─── MOON PHASE ──────────────────────────────────────────
function getMoonPhase() {
  const now = new Date();
  const known = new Date(2000, 0, 6, 18, 14, 0);
  const diff = now - known;
  const days = diff / (1000 * 60 * 60 * 24);
  const cycle = 29.53058867;
  const phase = ((days % cycle) + cycle) % cycle;

  let name, emoji, illumination;
  if (phase < 1.85) { name = "New Moon"; emoji = "🌑"; illumination = 0; }
  else if (phase < 7.38) { name = "Waxing Crescent"; emoji = "🌒"; illumination = Math.round((phase/7.38)*45); }
  else if (phase < 9.22) { name = "First Quarter"; emoji = "🌓"; illumination = 50; }
  else if (phase < 14.77) { name = "Waxing Gibbous"; emoji = "🌔"; illumination = Math.round(50+((phase-9.22)/5.55)*45); }
  else if (phase < 16.61) { name = "Full Moon"; emoji = "🌕"; illumination = 100; }
  else if (phase < 22.15) { name = "Waning Gibbous"; emoji = "🌖"; illumination = Math.round(100-((phase-16.61)/5.54)*45); }
  else if (phase < 23.99) { name = "Last Quarter"; emoji = "🌗"; illumination = 50; }
  else if (phase < 29.53) { name = "Waning Crescent"; emoji = "🌘"; illumination = Math.round(45-((phase-23.99)/5.54)*45); }
  else { name = "New Moon"; emoji = "🌑"; illumination = 0; }

  document.getElementById('moon-data').innerHTML = `
    <div class="moon-display">
      <div class="moon-emoji">${emoji}</div>
      <div class="moon-name">${name}</div>
      <div class="moon-illumination">${illumination}% illuminated</div>
      <div class="moon-illumination" style="margin-top:8px">Day ${Math.round(phase)} of 29.5 day cycle</div>
    </div>
  `;
  return { phase, name, illumination };
}

// ─── SOLUNAR / FISH ACTIVITY ─────────────────────────────
function calcFishActivity(moonPhase) {
  const phase = moonPhase.phase;
  const cycle = 29.53;
  const distFromFull = Math.min(Math.abs(phase - 14.77), cycle - Math.abs(phase - 14.77));
  const distFromNew = Math.min(phase, cycle - phase);
  const moonScore = Math.max(0, 100 - (Math.min(distFromFull, distFromNew) / 7.4) * 50);

  const hour = new Date().getHours();
  const timeScore = (hour >= 5 && hour <= 9) ? 90 :
                    (hour >= 17 && hour <= 20) ? 85 :
                    (hour >= 10 && hour <= 16) ? 60 : 30;

  const overall = Math.round((moonScore * 0.5) + (timeScore * 0.5));

  document.getElementById('solunar-data').innerHTML = `
    <div class="activity-bar-wrap">
      <div class="activity-label">Overall Activity: ${overall}%</div>
      <div class="activity-bar"><div class="activity-fill" style="width:${overall}%"></div></div>
    </div>
    <div class="activity-bar-wrap">
      <div class="activity-label">Moon Influence: ${Math.round(moonScore)}%</div>
      <div class="activity-bar"><div class="activity-fill" style="width:${moonScore}%"></div></div>
    </div>
    <div class="activity-bar-wrap">
      <div class="activity-label">Time of Day: ${Math.round(timeScore)}%</div>
      <div class="activity-bar"><div class="activity-fill" style="width:${timeScore}%"></div></div>
    </div>
    <p style="margin-top:12px;font-size:0.85rem;color:#90caf9">
      ${overall >= 75 ? '🔥 Excellent fishing conditions today!' :
        overall >= 50 ? '👍 Good conditions — get out there!' :
        '⚓ Slow bite expected — try early morning or evening.'}
    </p>
  `;
}

// ─── FISH SPECIES ────────────────────────────────────────
function loadFishData() {
  const month = new Date().getMonth();
  const fish = [
    { name: "Gag Grouper", emoji: "🐟", detail: "Bottom structure, 30-120ft — look for rocky ledges", months: [0,1,2,3,4,5,6,7,8,9,10,11], rating: "⭐⭐⭐⭐⭐" },
    { name: "Red Grouper", emoji: "🐠", detail: "Hard bottom & reefs, 60-200ft", months: [0,1,2,3,4,5,6,7,8,9,10,11], rating: "⭐⭐⭐⭐⭐" },
    { name: "Snook", emoji: "🎣", detail: "Inshore — bridges, docks, mangroves", months: [3,4,5,6,7,8,9,10], rating: "⭐⭐⭐⭐" },
    { name: "Redfish", emoji: "🐡", detail: "Shallow flats, grass beds, oyster bars", months: [0,1,2,3,4,8,9,10,11], rating: "⭐⭐⭐⭐" },
    { name: "Flounder", emoji: "🦈", detail: "Sandy bottom near structure changes", months: [8,9,10,11,0,1], rating: "⭐⭐⭐" },
    { name: "Mangrove Snapper", emoji: "🐟", detail: "Nearshore reefs & structure", months: [4,5,6,7,8,9,10], rating: "⭐⭐⭐⭐" }
  ];

  const inSeason = fish.filter(f => f.months.includes(month));
  document.getElementById('fish-data').innerHTML = inSeason.map(f => `
    <div class="fish-item">
      <span class="fish-emoji">${f.emoji}</span>
      <div class="fish-info">
        <div class="fish-name">${f.name}</div>
        <div class="fish-detail">${f.detail}</div>
      </div>
      <span class="fish-rating">${f.rating}</span>
    </div>
  `).join('');
}
// ─── SUNRISE & SUNSET ────────────────────────────────────
async function loadSunTimes() {
  try {
    const res = await fetch('/api/sun');
    const d = await res.json();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/New_York'
    });

    function isGoldenHour() {
      const hour = now.getHours();
      const min = now.getMinutes();
      const current = hour * 60 + min;

      const parseTime = (str) => {
        const [time, period] = str.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };

      const mgStart = parseTime(d.morningGoldenStart);
      const mgEnd = parseTime(d.morningGoldenEnd);
      const egStart = parseTime(d.eveningGoldenStart);
      const egEnd = parseTime(d.eveningGoldenEnd);

      if (current >= mgStart && current <= mgEnd) return '🌅 Morning golden hour — GET OUT THERE!';
      if (current >= egStart && current <= egEnd) return '🌇 Evening golden hour — GET OUT THERE!';
      return null;
    }

    const goldenAlert = isGoldenHour();

    document.getElementById('sun-data').innerHTML = `
      ${goldenAlert ? `<div style="background:rgba(244,166,32,0.15);border:1px solid rgba(244,166,32,0.3);border-radius:12px;padding:10px 14px;margin-bottom:14px;color:#f4a620;font-weight:600;font-size:0.9rem;">${goldenAlert}</div>` : ''}
      <div class="tide-item">
        <span>🌅 Sunrise</span>
        <span style="color:#f4a620;font-weight:600">${d.sunrise}</span>
      </div>
      <div class="tide-item">
        <span>🌇 Sunset</span>
        <span style="color:#f77f00;font-weight:600">${d.sunset}</span>
      </div>
      <div class="tide-item">
        <span>☀️ Daylight</span>
        <span style="color:#4fc3f7">${d.daylight}</span>
      </div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:0.75rem;color:#7eb8d4;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Golden Hours</div>
        <div class="tide-item">
          <span>🌄 Morning</span>
          <span style="color:#ffd166;font-size:0.85rem">${d.morningGoldenStart} – ${d.morningGoldenEnd}</span>
        </div>
        <div class="tide-item">
          <span>🌆 Evening</span>
          <span style="color:#ffd166;font-size:0.85rem">${d.eveningGoldenStart} – ${d.eveningGoldenEnd}</span>
        </div>
      </div>
    `;
  } catch (e) {
    document.getElementById('sun-data').innerHTML = '<p style="color:#ff8a65">Sun data unavailable.</p>';
  }
}
// ─── WATER TEMP ───────────────────────────────────────────
async function loadWaterTemp() {
  try {
    const res = await fetch('/api/watertemp');
    const d = await res.json();

    const grouperTip = d.waterTemp
      ? parseFloat(d.waterTemp) < 65
        ? '🔵 Cool water — grouper moving deeper, try 80-120ft'
        : parseFloat(d.waterTemp) < 72
        ? '🟡 Good temp — grouper active on structure 60-100ft'
        : '🟢 Warm water — grouper shallow, try 40-80ft ledges'
      : '';

    document.getElementById('temp-data').innerHTML = `
      <div class="tide-item">
        <span>🌊 Water Temp</span>
        <span style="color:#4fc3f7;font-weight:bold">${d.waterTemp ? d.waterTemp + '°F' : 'N/A'}</span>
      </div>
      <div class="tide-item">
        <span>🌤️ Air Temp</span>
        <span style="color:#4fc3f7">${d.airTemp ? d.airTemp + '°F' : 'N/A'}</span>
      </div>
      <div class="tide-item">
        <span>💨 Wind Speed</span>
        <span style="color:#4fc3f7">${d.windSpeed ? d.windSpeed + ' mph' : 'N/A'}</span>
      </div>
      <div class="tide-item">
        <span>🌊 Wave Height</span>
        <span style="color:#4fc3f7">${d.waveHeight ? d.waveHeight + ' ft' : 'N/A'}</span>
      </div>
      ${grouperTip ? `<p style="margin-top:12px;font-size:0.85rem;color:#90caf9">${grouperTip}</p>` : ''}
    `;

    updateConditions({
      waterTemp: d.waterTemp,
      airTemp: d.airTemp,
      windSpeed: d.windSpeed,
      waveHeight: d.waveHeight
    });
    return d;
  } catch (e) {
    document.getElementById('temp-data').innerHTML = '<p style="color:#ff8a65">Conditions data unavailable.</p>';
  }
}

// ─── WEATHER FORECAST ────────────────────────────────────
async function loadWeather() {
  try {
    const res = await fetch('/api/weather');
    const data = await res.json();
    const daily = data.daily;

    const weatherCodes = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌦️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️',
      80: '🌦️', 81: '🌧️', 82: '⛈️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };

    function getFishingScore(wind, rain, code) {
      let score = 100;
      if (wind > 20) score -= 40;
      else if (wind > 15) score -= 20;
      else if (wind > 10) score -= 10;
      if (rain > 70) score -= 40;
      else if (rain > 40) score -= 20;
      else if (rain > 20) score -= 10;
      if ([65,82,95,96,99].includes(code)) score -= 30;
      return Math.max(0, score);
    }

    function getFishingBadge(score) {
      if (score >= 80) return '<span class="fishing-badge badge-great">🔥 Great</span>';
      if (score >= 60) return '<span class="fishing-badge badge-good">👍 Good</span>';
      if (score >= 40) return '<span class="fishing-badge badge-fair">⚠️ Fair</span>';
      return '<span class="fishing-badge badge-rough">⛔ Rough</span>';
    }

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let bestScore = -1;
    let bestIndex = 0;

    document.getElementById('weather-data').innerHTML = daily.time.map((dateStr, i) => {
      const date = new Date(dateStr + 'T12:00:00');
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()];
      const monthDay = `${months[date.getMonth()]} ${date.getDate()}`;
      const icon = weatherCodes[daily.weathercode[i]] || '🌤️';
      const high = Math.round(daily.temperature_2m_max[i]);
      const low = Math.round(daily.temperature_2m_min[i]);
      const wind = Math.round(daily.windspeed_10m_max[i]);
      const rain = daily.precipitation_probability_max[i];
      const code = daily.weathercode[i];
      const score = getFishingScore(wind, rain, code);

      if (score > bestScore) { bestScore = score; bestIndex = i; }

      return `
        <div class="weather-day">
          <div class="weather-date">${dayName}<br><span style="color:#90caf9;font-size:0.8rem">${monthDay}</span></div>
          <span class="weather-icon">${icon}</span>
          <div class="weather-temps">🌡️ ${high}° / ${low}°</div>
          <div class="weather-wind">💨 ${wind} mph</div>
          <div class="weather-rain">🌧️ ${rain}%</div>
          ${getFishingBadge(score)}
        </div>
      `;
    }).join('');

    // ─── BEST DAY BANNER ───
    const bestDate = new Date(daily.time[bestIndex] + 'T12:00:00');
    const bestDayName = bestIndex === 0 ? 'TODAY' : bestIndex === 1 ? 'TOMORROW' : days[bestDate.getDay()].toUpperCase();
    const bestMonthDay = `${months[bestDate.getMonth()]} ${bestDate.getDate()}`;
    const bestWind = Math.round(daily.windspeed_10m_max[bestIndex]);
    const bestRain = daily.precipitation_probability_max[bestIndex];
    const bestIcon = weatherCodes[daily.weathercode[bestIndex]] || '🌤️';

    document.getElementById('best-day-result').innerHTML = `${bestIcon} ${bestDayName} · ${bestMonthDay}`;
    document.getElementById('best-day-reason').innerHTML =
      `💨 Wind ${bestWind} mph &nbsp;·&nbsp; 🌧️ ${bestRain}% rain chance &nbsp;·&nbsp; Fishing Score: <strong style="color:var(--gold)">${bestScore}/100</strong>`;

  } catch (e) {
    document.getElementById('weather-data').innerHTML = '<p style="color:#ff8a65">Weather data unavailable.</p>';
  }
}

// ─── MAP ─────────────────────────────────────────────────
function initMap() {
  const tarponSprings = [28.1500, -82.7543];
  const map = L.map('map').setView(tarponSprings, 12);

  const noaa = L.tileLayer('https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png', {
    attribution: 'NOAA Nautical Charts', maxZoom: 18
  });

  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri Satellite', maxZoom: 18
  });

  const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 18
  });

  const openSeaMap = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    attribution: 'OpenSeaMap', maxZoom: 18, opacity: 0.9
  });

  const noaaOverlay = L.tileLayer('https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png', {
    attribution: 'NOAA Charts Overlay', maxZoom: 18, opacity: 0.7
  });

  satellite.addTo(map);
  openSeaMap.addTo(map);

  const baseLayers = {
    "🛰️ Satellite": satellite,
    "🗺️ NOAA Nautical": noaa,
    "🌍 Street Map": street,
  };

  const overlays = {
    "🌊 OpenSeaMap (buoys, wrecks, markers)": openSeaMap,
    "📏 NOAA Depth Chart Overlay": noaaOverlay,
  };

  L.control.layers(baseLayers, overlays, { position: 'topright', collapsed: false }).addTo(map);

  let savedSpots = JSON.parse(localStorage.getItem('fishingSpots') || '[]');

  function renderSpots() {
    document.getElementById('spots-list').innerHTML = savedSpots.map((spot, i) => `
      <li>
        <span>📍 ${spot.name} — ${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}</span>
        <button class="delete-btn" onclick="deleteSpot(${i})">Remove</button>
      </li>
    `).join('');
  }

  savedSpots.forEach(spot => {
    L.marker([spot.lat, spot.lng]).addTo(map).bindPopup(`<b>${spot.name}</b>`);
  });

  map.on('click', function(e) {
    const name = prompt('Name this fishing spot:');
    if (!name) return;
    const spot = { name, lat: e.latlng.lat, lng: e.latlng.lng };
    savedSpots.push(spot);
    localStorage.setItem('fishingSpots', JSON.stringify(savedSpots));
    L.marker([spot.lat, spot.lng]).addTo(map).bindPopup(`<b>${spot.name}</b>`).openPopup();
    renderSpots();
  });

  window.deleteSpot = function(i) {
    savedSpots.splice(i, 1);
    localStorage.setItem('fishingSpots', JSON.stringify(savedSpots));
    renderSpots();
  };

  renderSpots();
}
// ─── CATCH LOGGER ────────────────────────────────────────
function initCatchLogger() {
  let catches = JSON.parse(localStorage.getItem('gulfStrikeCatches') || '[]');

  function getFishEmoji(species) {
    const s = species.toLowerCase();
    if (s.includes('grouper')) return '🐟';
    if (s.includes('snook')) return '🎣';
    if (s.includes('redfish') || s.includes('red drum')) return '🐡';
    if (s.includes('snapper')) return '🐠';
    if (s.includes('flounder')) return '🦈';
    if (s.includes('tarpon')) return '🏆';
    if (s.includes('mahi')) return '🐬';
    if (s.includes('cobia')) return '🦈';
    return '🐟';
  }

  function getPersonalRecord(species, weight) {
    const speciesCatches = catches.filter(c => 
      c.species.toLowerCase() === species.toLowerCase() && parseFloat(c.weight) > 0
    );
    if (speciesCatches.length === 0) return false;
    const maxWeight = Math.max(...speciesCatches.map(c => parseFloat(c.weight) || 0));
    return parseFloat(weight) >= maxWeight;
  }

  function renderCatches() {
    const list = document.getElementById('catch-list');
    
    if (catches.length === 0) {
      list.innerHTML = `
        <div class="empty-catches">
          🎣 No catches logged yet!<br>
          <span style="font-size:0.8rem">Log your first catch above</span>
        </div>
      `;
      return;
    }

    const totalCatches = catches.length;
    const totalWeight = catches.reduce((a, b) => a + (parseFloat(b.weight) || 0), 0).toFixed(1);
    const species = [...new Set(catches.map(c => c.species))].length;
    const biggestCatch = catches.reduce((max, c) => 
      (parseFloat(c.weight) || 0) > (parseFloat(max.weight) || 0) ? c : max, catches[0]);

    list.innerHTML = `
      <div class="catch-stats-bar">
        <div class="catch-stat-item">
          <div class="catch-stat-number">${totalCatches}</div>
          <div class="catch-stat-label">Total Catches</div>
        </div>
        <div class="catch-stat-item">
          <div class="catch-stat-number">${totalWeight}</div>
          <div class="catch-stat-label">Total lbs</div>
        </div>
        <div class="catch-stat-item">
          <div class="catch-stat-number">${species}</div>
          <div class="catch-stat-label">Species</div>
        </div>
        <div class="catch-stat-item">
          <div class="catch-stat-number">${biggestCatch.weight || '?'}</div>
          <div class="catch-stat-label">Biggest (lbs)</div>
        </div>
      </div>
      ${catches.slice().reverse().map((c, i) => {
        const realIndex = catches.length - 1 - i;
        const isRecord = c.weight && getPersonalRecord(c.species, c.weight);
        return `
          <div class="catch-entry">
            <span class="catch-entry-emoji">${getFishEmoji(c.species)}</span>
            <div class="catch-entry-info">
              <div class="catch-entry-species">
                ${c.species}
                ${isRecord ? '<span class="catch-record-badge">🏆 Personal Record!</span>' : ''}
              </div>
              <div class="catch-entry-details">
                ${c.location ? `📍 ${c.location}` : ''}
                ${c.bait ? ` · 🎣 ${c.bait}` : ''}
                ${c.depth ? ` · 📏 ${c.depth}ft` : ''}
                ${c.notes ? `<br>📝 ${c.notes}` : ''}
              </div>
            </div>
            <div class="catch-entry-stats">
              <div class="catch-entry-weight">${c.weight ? c.weight + ' lbs' : '?'}</div>
              <div class="catch-entry-date">${c.length ? c.length + '"' : ''}</div>
              <div class="catch-entry-date">${c.date}</div>
            </div>
            <button class="catch-delete-btn" onclick="deleteCatch(${realIndex})">Remove</button>
          </div>
        `;
      }).join('')}
    `;
  }

  window.deleteCatch = function(i) {
    catches.splice(i, 1);
    localStorage.setItem('gulfStrikeCatches', JSON.stringify(catches));
    renderCatches();
  };

  document.getElementById('log-catch-btn').addEventListener('click', () => {
    const species = document.getElementById('log-species').value.trim();
    if (!species) {
      alert('Please enter a species name!');
      return;
    }

    const now = new Date();
    const catch_ = {
      species,
      weight: document.getElementById('log-weight').value,
      length: document.getElementById('log-length').value,
      bait: document.getElementById('log-bait').value,
      location: document.getElementById('log-location').value,
      depth: document.getElementById('log-depth').value,
      notes: document.getElementById('log-notes').value,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };

    catches.push(catch_);
    localStorage.setItem('gulfStrikeCatches', JSON.stringify(catches));

    // Clear form
    ['log-species','log-weight','log-length','log-bait','log-location','log-depth','log-notes'].forEach(id => {
      document.getElementById(id).value = '';
    });

    renderCatches();

    // Show success message
    const btn = document.getElementById('log-catch-btn');
    btn.textContent = '✅ Catch Logged!';
    btn.style.background = 'linear-gradient(135deg, #00e676, #00b4d8)';
    setTimeout(() => {
      btn.textContent = '🎣 Log This Catch!';
      btn.style.background = '';
    }, 2000);
  });

  renderCatches();
}
// ─── AI CATCH IDENTIFIER ─────────────────────────────────
function initCatchIdentifier() {
  const photoInput = document.getElementById('catch-photo');
  const preview = document.getElementById('catch-preview');
  const identifyBtn = document.getElementById('identify-btn');
  const result = document.getElementById('catch-result');
  const uploadArea = document.getElementById('catch-upload-area');

  let imageData = null;
  let mediaType = null;

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    mediaType = file.type || 'image/jpeg';
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target.result;
      imageData = base64.split(',')[1];

      preview.src = event.target.result;
      preview.style.display = 'block';
      uploadArea.style.borderColor = 'rgba(0,180,216,0.6)';
      identifyBtn.style.display = 'block';
      result.style.display = 'none';
    };

    reader.readAsDataURL(file);
  });

  identifyBtn.addEventListener('click', async () => {
    if (!imageData) return;

    identifyBtn.disabled = true;
    identifyBtn.textContent = '🤖 Analyzing your catch...';
    result.style.display = 'none';

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mediaType })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const legalClass = data.legalToKeep === true ? 'legal-yes' : data.legalToKeep === false ? 'legal-no' : 'legal-unknown';
      const legalIcon = data.legalToKeep === true ? '✅ Legal to Keep' : data.legalToKeep === false ? '❌ Must Release' : '⚠️ Check Regulations';

      result.style.display = 'block';
      result.innerHTML = `
        <div class="catch-species">${data.species || 'Unknown Species'}</div>
        <div class="catch-confidence">🔬 ${data.scientificName || ''} · ${data.confidence || 0}% confidence</div>
        <div class="legal-badge ${legalClass}">${legalIcon}</div>
        <div class="catch-grid">
          <div class="catch-card">
            <div class="catch-card-label">📏 Est. Length</div>
            <div class="catch-card-value">${data.estimatedLength || 'Unknown'}</div>
          </div>
          <div class="catch-card">
            <div class="catch-card-label">⚖️ Est. Weight</div>
            <div class="catch-card-value">${data.estimatedWeight || 'Unknown'}</div>
          </div>
          <div class="catch-card">
            <div class="catch-card-label">📐 Min Size</div>
            <div class="catch-card-value">${data.minimumSize || 'Unknown'}</div>
          </div>
          <div class="catch-card">
            <div class="catch-card-label">🎣 Bag Limit</div>
            <div class="catch-card-value">${data.bagLimit || 'Unknown'}</div>
          </div>
          <div class="catch-card">
            <div class="catch-card-label">📅 Season</div>
            <div class="catch-card-value">${data.season || 'Unknown'}</div>
          </div>
          <div class="catch-card">
            <div class="catch-card-label">⚠️ Regulations</div>
            <div class="catch-card-value">${data.legalNote || 'Check FWC'}</div>
          </div>
        </div>
        <div class="catch-cooking">
          🍳 <strong>How to Cook:</strong> ${data.cookingMethod || 'Unknown'}<br><br>
          😋 <strong>Taste:</strong> ${data.taste || 'Unknown'}<br><br>
          🎯 <strong>Fun Fact:</strong> ${data.funFact || 'Unknown'}
        </div>
      `;

    } catch(e) {
      result.style.display = 'block';
      result.innerHTML = '<p style="color:#ff8a65">Could not identify fish. Make sure the photo is clear and try again!</p>';
    }

    identifyBtn.disabled = false;
    identifyBtn.textContent = '🤖 Identify My Catch!';
  });
}
// ─── FISH MIGRATION TRACKER ──────────────────────────────
async function loadMigrationData() {
  try {
    const res = await fetch('/api/migration');
    const data = await res.json();

    document.getElementById('migration-data').innerHTML = `
      <div class="migration-header">
        <div>
          <div class="migration-avg-temp">${data.avgTemp}°F</div>
          <div class="migration-avg-label">Avg Gulf Water Temp</div>
        </div>
        <div class="migration-buoys">
          ${data.buoys.map(b => `
            <div class="buoy-pill">
              ${b.name}: <span>${b.tempF}°F</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="migration-grid">
        ${data.movements.map(fish => `
          <div class="migration-card">
            <div class="migration-species">
              <span class="migration-emoji">${fish.emoji}</span>
              <div>
                <div class="migration-name">${fish.species}</div>
                <div class="migration-zone">🎯 ${fish.hotZone}</div>
              </div>
            </div>
            <div class="migration-movement">${fish.movement}</div>
            <div class="migration-direction">
              📍 Moving: ${fish.direction}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) {
    document.getElementById('migration-data').innerHTML = '<p style="color:#ff8a65">Migration data unavailable.</p>';
  }
}
// ─── BAIT SHOP FINDER ────────────────────────────────────
function initBaitShopFinder() {
  async function searchBaitShops(query) {
    const results = document.getElementById('baitshop-results');
    results.innerHTML = '<p style="color:var(--text-muted);padding:20px 0">🔍 Searching for bait shops...</p>';

    try {
      const res = await fetch(`/api/baitshops?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.shops || data.shops.length === 0) {
        results.innerHTML = '<p style="color:#ff8a65;padding:20px 0">No bait shops found. Try a different city or zip code!</p>';
        return;
      }

      results.innerHTML = `
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:14px">Found ${data.shops.length} bait shops near <strong style="color:#fff">${query}</strong></p>
        <div class="baitshop-grid">
          ${data.shops.map(shop => `
            <div class="baitshop-card">
              <div class="baitshop-name">🎣 ${shop.name}</div>
              <div class="baitshop-address">📍 ${shop.address}</div>
              <div class="baitshop-meta">
                ${shop.rating ? `<span class="baitshop-rating">⭐ ${shop.rating} (${shop.totalRatings} reviews)</span>` : ''}
                ${shop.open === true ? '<span class="baitshop-open open-yes">✅ Open Now</span>' :
                  shop.open === false ? '<span class="baitshop-open open-no">❌ Closed</span>' :
                  '<span class="baitshop-open open-unknown">🕐 Hours Unknown</span>'}
              </div>
              <a class="baitshop-directions" href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}" target="_blank">🗺️ Get Directions</a>
            </div>
          `).join('')}
        </div>
      `;
    } catch(e) {
      results.innerHTML = '<p style="color:#ff8a65;padding:20px 0">Could not load bait shops. Try again!</p>';
    }
  }

  document.getElementById('baitshop-search').addEventListener('click', () => {
    const query = document.getElementById('baitshop-input').value.trim();
    if (!query) return;
    searchBaitShops(query);
  });

  document.getElementById('baitshop-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const query = document.getElementById('baitshop-input').value.trim();
      if (query) searchBaitShops(query);
    }
  });

  document.getElementById('baitshop-gps').addEventListener('click', () => {
    const btn = document.getElementById('baitshop-gps');
    btn.textContent = '📍 Getting location...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`/api/baitshops?query=${latitude},${longitude}`);
        const data = await res.json();
        btn.textContent = '📍 Use My Location';
        btn.disabled = false;

        if (!data.shops || data.shops.length === 0) {
          document.getElementById('baitshop-results').innerHTML = '<p style="color:#ff8a65">No bait shops found nearby!</p>';
          return;
        }

        document.getElementById('baitshop-results').innerHTML = `
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:14px">Found ${data.shops.length} bait shops near your location</p>
          <div class="baitshop-grid">
            ${data.shops.map(shop => `
              <div class="baitshop-card">
                <div class="baitshop-name">🎣 ${shop.name}</div>
                <div class="baitshop-address">📍 ${shop.address}</div>
                <div class="baitshop-meta">
                  ${shop.rating ? `<span class="baitshop-rating">⭐ ${shop.rating} (${shop.totalRatings} reviews)</span>` : ''}
                  ${shop.open === true ? '<span class="baitshop-open open-yes">✅ Open Now</span>' :
                    shop.open === false ? '<span class="baitshop-open open-no">❌ Closed</span>' :
                    '<span class="baitshop-open open-unknown">🕐 Hours Unknown</span>'}
                </div>
                <a class="baitshop-directions" href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}" target="_blank">🗺️ Get Directions</a>
              </div>
            `).join('')}
          </div>
        `;
      },
      () => {
        btn.textContent = '📍 Use My Location';
        btn.disabled = false;
        alert('Could not get your location. Try searching by city instead!');
      }
    );
  });
}
// ─── AI BAIT RECOMMENDER ─────────────────────────────────
let selectedTarget = 'grouper';

function initBaitRecommender() {
  const btns = document.querySelectorAll('.target-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTarget = btn.dataset.target;
    });
  });

  document.getElementById('bait-btn').addEventListener('click', async () => {
    const btn = document.getElementById('bait-btn');
    const result = document.getElementById('bait-result');

    btn.disabled = true;
    btn.textContent = '⚡ Analyzing conditions...';
    result.style.display = 'none';

    try {
      const prompt = `You are an expert fishing guide for Tarpon Springs and Dunedin, Florida Gulf Coast waters.

Current live conditions:
- Water Temperature: ${currentConditions.waterTemp || 'unknown'}°F
- Air Temperature: ${currentConditions.airTemp || 'unknown'}°F
- Wind Speed: ${currentConditions.windSpeed || 'unknown'} mph
- Wave Height: ${currentConditions.waveHeight || 'unknown'} ft
- Moon Phase: ${currentConditions.moonPhase || 'unknown'}
- Time of day: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
- Target species: ${selectedTarget.toUpperCase()}

Based on these exact conditions, provide a bait and rig recommendation. Respond ONLY with a JSON object, no markdown, no explanation, just raw JSON:
{
  "topBait": "specific bait name",
  "secondBait": "alternative bait",
  "rig": "specific rig name",
  "depth": "depth range in feet",
  "technique": "one sentence technique tip",
  "confidence": 85,
  "proTip": "one specific local pro tip for these exact conditions"
}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          conditions: currentConditions,
          raw: true
        })
      });

      const data = await res.json();
      let rec;

      try {
        const clean = data.reply.replace(/```json|```/g, '').trim();
        rec = JSON.parse(clean);
      } catch(e) {
        throw new Error('Could not parse recommendation');
      }

      result.style.display = 'block';
      result.innerHTML = `
        <div style="font-size:0.75rem;letter-spacing:3px;color:var(--gold);text-transform:uppercase;margin-bottom:4px">⚡ AI Recommendation for ${selectedTarget.toUpperCase()}</div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Based on your live conditions right now</div>
        <div class="bait-grid">
          <div class="bait-card">
            <div class="bait-card-label">🎯 Top Bait</div>
            <div class="bait-card-value">${rec.topBait}</div>
          </div>
          <div class="bait-card">
            <div class="bait-card-label">🔄 Alternative</div>
            <div class="bait-card-value">${rec.secondBait}</div>
          </div>
          <div class="bait-card">
            <div class="bait-card-label">🪝 Rig</div>
            <div class="bait-card-value">${rec.rig}</div>
          </div>
          <div class="bait-card">
            <div class="bait-card-label">📏 Depth</div>
            <div class="bait-card-value">${rec.depth}</div>
          </div>
        </div>
        <div class="bait-tip">💡 <strong>Technique:</strong> ${rec.technique}</div>
        <div class="bait-tip" style="margin-top:8px;border-left-color:var(--gold)">⚡ <strong>Pro Tip:</strong> ${rec.proTip}</div>
        <div class="bait-confidence">
          <span class="bait-confidence-label">AI Confidence</span>
          <div class="bait-confidence-bar">
            <div class="bait-confidence-fill" style="width:${rec.confidence}%"></div>
          </div>
          <span class="bait-confidence-pct">${rec.confidence}%</span>
        </div>
      `;

    } catch(e) {
      result.style.display = 'block';
      result.innerHTML = '<p style="color:#ff8a65">Could not get recommendation. Try again!</p>';
    }

    btn.disabled = false;
    btn.textContent = '⚡ Get Bait Recommendation';
  });
}
// ─── AI CHAT ─────────────────────────────────────────────
let currentConditions = {};

function updateConditions(data) {
  currentConditions = { ...currentConditions, ...data };
}

function addChatMessage(role, text) {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <span class="chat-avatar">${role === 'user' ? '🎣' : '🤖'}</span>
    <div class="chat-bubble">${text}</div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');
  const message = input.value.trim();
  if (!message) return;

  addChatMessage('user', message);
  input.value = '';
  btn.disabled = true;
  btn.textContent = 'Thinking... 🤔';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conditions: currentConditions })
    });
    const data = await res.json();
    addChatMessage('ai', data.reply || 'Sorry, I could not get a response.');
  } catch (e) {
    addChatMessage('ai', 'Sorry, something went wrong. Try again!');
  }

  btn.disabled = false;
  btn.textContent = 'Ask 🎣';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendChat();
  });
  addChatMessage('ai', "Hey! I'm your AI fishing guide for Tarpon Springs 🎣 I already know today's water temp, tides, moon phase and conditions. Ask me anything — bait, rigs, spots, timing, you name it!");
});

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTides();
  loadWaterTemp();
  loadSunTimes();
  const moon = getMoonPhase();
  updateConditions({ moonPhase: moon.name });
  calcFishActivity(moon);
  loadFishData();
  loadWeather();
  initMap();
  initBaitRecommender();
  initBaitShopFinder();
  loadMigrationData();
  initCatchIdentifier();
  initCatchLogger();
});