const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
const PORT = 3000;
const ANTHROPIC_API_KEY = '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';
const GOOGLE_API_KEY = 'AIzaSyAAHIB_dN951zFeYMmqn2VR3JM70rAvC8A';
app.use(express.static(path.join(__dirname)));

app.get('/api/tides', async (req, res) => {
  try {
    const stationId = '8726520';
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${dateStr}&range=24&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&application=fishing_app&format=json`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/watertemp', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://www.ndbc.noaa.gov/data/realtime2/42036.txt');
    const text = await response.text();
    const lines = text.split('\n');
    const headers = lines[0].replace('#','').trim().split(/\s+/);
    const dataLine = lines[2].trim().split(/\s+/);
    const wtmpIndex = headers.indexOf('WTMP');
    const atmpIndex = headers.indexOf('ATMP');
    const wspdIndex = headers.indexOf('WSPD');
    const wvhtIndex = headers.indexOf('WVHT');
    const celsiusToF = c => c === 'MM' ? null : ((parseFloat(c) * 9/5) + 32).toFixed(1);
    const msToMph = s => s === 'MM' ? null : (parseFloat(s) * 2.237).toFixed(1);
    const mToFt = m => m === 'MM' ? null : (parseFloat(m) * 3.281).toFixed(1);
    res.json({
      waterTemp: celsiusToF(dataLine[wtmpIndex]),
      airTemp: celsiusToF(dataLine[atmpIndex]),
      windSpeed: msToMph(dataLine[wspdIndex]),
      waveHeight: mToFt(dataLine[wvhtIndex]),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const lat = 28.1500;
    const lng = -82.7543;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,weathercode&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=5`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sun', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const lat = 28.1500;
    const lng = -82.7543;
    const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
    const data = await response.json();
    const results = data.results;
    function toLocalTime(utcStr) {
      const date = new Date(utcStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/New_York'
      });
    }
    function addMinutes(utcStr, mins) {
      const date = new Date(utcStr);
      date.setMinutes(date.getMinutes() + mins);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/New_York'
      });
    }
    const daylightSecs = results.day_length;
    const hours = Math.floor(daylightSecs / 3600);
    const mins = Math.floor((daylightSecs % 3600) / 60);
    res.json({
      sunrise: toLocalTime(results.sunrise),
      sunset: toLocalTime(results.sunset),
      morningGoldenStart: addMinutes(results.sunrise, -20),
      morningGoldenEnd: addMinutes(results.sunrise, 60),
      eveningGoldenStart: addMinutes(results.sunset, -60),
      eveningGoldenEnd: addMinutes(results.sunset, 20),
      daylight: `${hours}h ${mins}m`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const { message, conditions, raw } = req.body;
    const systemPrompt = raw
      ? `You are an expert fishing guide for Tarpon Springs and Dunedin, Florida. Always respond with ONLY a valid JSON object. No markdown, no backticks, no explanation. Just raw JSON.`
      : `You are an expert fishing guide specializing in the Tarpon Springs and Gulf of Mexico area in Florida. Current conditions: Water Temp: ${conditions.waterTemp || 'unknown'}F, Wind: ${conditions.windSpeed || 'unknown'} mph, Moon: ${conditions.moonPhase || 'unknown'}. Give practical, specific advice. Keep responses friendly and actionable.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });
    const data = await response.json();
    res.json({ reply: data.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/baitshops', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const { query } = req.query;

    // First geocode the search query to get coordinates
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + ' Florida')}&key=${GOOGLE_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.json({ shops: [], error: 'Location not found' });
    }

    const { lat, lng } = geoData.results[0].geometry.location;

    // Search for bait shops nearby
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=25000&keyword=bait+shop+fishing+tackle&key=${GOOGLE_API_KEY}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    const shops = (placesData.results || []).slice(0, 10).map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      open: place.opening_hours ? place.opening_hours.open_now : null,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      placeId: place.place_id
    }));

    res.json({ shops, center: { lat, lng } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/migration', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;

    // Get water temps from multiple NOAA buoys around Florida Gulf Coast
    const buoys = [
      { id: '42036', name: 'West Tampa/Gulf', lat: 28.50, lng: -84.517 },
      { id: '42013', name: 'Crystal River', lat: 28.786, lng: -84.467 },
      { id: 'CDRF1', name: 'Cedar Key', lat: 29.133, lng: -83.033 },
      { id: 'TPAF1', name: 'Tampa Bay', lat: 27.967, lng: -82.433 },
      { id: 'VENF1', name: 'Venice', lat: 27.067, lng: -82.450 },
    ];

    const temps = await Promise.allSettled(
      buoys.map(async buoy => {
        const url = `https://www.ndbc.noaa.gov/data/realtime2/${buoy.id}.txt`;
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');
        const headers = lines[0].replace('#','').trim().split(/\s+/);
        const dataLine = lines[2].trim().split(/\s+/);
        const wtmpIndex = headers.indexOf('WTMP');
        const tempC = dataLine[wtmpIndex];
        const tempF = tempC === 'MM' ? null : ((parseFloat(tempC) * 9/5) + 32).toFixed(1);
        return { ...buoy, tempF: parseFloat(tempF) };
      })
    );

    const validTemps = temps
      .filter(t => t.status === 'fulfilled' && t.value.tempF)
      .map(t => t.value);

    // Generate fish movement predictions based on temps
    const avgTemp = validTemps.reduce((a, b) => a + b.tempF, 0) / validTemps.length;

    const predictions = {
      avgTemp: avgTemp.toFixed(1),
      buoys: validTemps,
      movements: [
        {
          species: 'Gag Grouper',
          emoji: '🐟',
          movement: avgTemp < 65
            ? 'Moving deeper — 80-120ft. Cold water pushing them off structure.'
            : avgTemp < 72
            ? 'Active on mid-depth structure 60-100ft. Prime conditions!'
            : 'Shallow structure 40-80ft. Warm water has them fired up!',
          direction: avgTemp < 68 ? 'deeper' : 'shallow',
          hotZone: avgTemp < 68 ? 'Offshore reefs 80-120ft' : 'Nearshore ledges 40-80ft'
        },
        {
          species: 'Snook',
          emoji: '🎣',
          movement: avgTemp < 60
            ? '⚠️ Cold stress — snook inactive, seek warm water discharge areas.'
            : avgTemp < 68
            ? 'Moving to warm water — power plant discharge, deep creeks, canals.'
            : avgTemp < 80
            ? 'Active inshore — bridges, docks, mangrove edges. Prime time!'
            : 'Early morning & evening bite only. Too warm midday.',
          direction: avgTemp < 65 ? 'warm refuges' : 'inshore structure',
          hotZone: avgTemp < 65 ? 'Warm water discharge areas' : 'Mangrove edges & bridges'
        },
        {
          species: 'Redfish',
          emoji: '🐡',
          movement: avgTemp < 60
            ? 'Schooled up in deeper holes and channels. Slow bite.'
            : avgTemp < 72
            ? 'Moving onto flats during warm afternoons. Great conditions!'
            : 'On the flats early morning. Seek shade and deeper edges midday.',
          direction: avgTemp < 65 ? 'deeper channels' : 'shallow flats',
          hotZone: avgTemp < 65 ? 'Deep grass flats & channels' : 'Shallow grass flats'
        },
        {
          species: 'Mangrove Snapper',
          emoji: '🐠',
          movement: avgTemp < 65
            ? 'Moving offshore to deeper reefs 40-80ft.'
            : avgTemp < 75
            ? 'Nearshore structure & docks. Very active!'
            : 'Scattered inshore and nearshore. Night bite excellent.',
          direction: avgTemp < 65 ? 'offshore' : 'inshore',
          hotZone: avgTemp < 65 ? 'Nearshore reefs 40-80ft' : 'Docks, bridges & structure'
        }
      ]
    };

    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Fishing app running at http://localhost:${PORT}`);
});