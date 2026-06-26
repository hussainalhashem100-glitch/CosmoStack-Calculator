/* CosmoStack: Core Application Logic */

import dsoCatalog from './data/dso_catalog.json';

// --- CONFIGURATION & HARDWARE PROFILES ---
const HARDWARE_DEFAULTS = {
  aperture: 30,       // mm
  focalLength: 160,   // mm
  pixelSize: 2.9,     // µm
  qe: 85,            // % peak
  readNoise: 1.5,     // e- RMS
  darkCurrent: 0.1,   // e-/pixel/sec
};

// State management
let state = {
  // Active hardware parameters
  hardware: { ...HARDWARE_DEFAULTS },
  
  // Current active target
  target: null,
  
  // Observation parameters
  sqm: 18.00,         // Default Bortle 8 (SQM 18.00)
  altitude: 45,       // Default 45°
  tSub: 10,           // Default 10s
  filterActive: false, // Dual-band filter toggle

  // Observation site location parameters
  location: {
    preset: 'amman',
    lat: 31.95,
    lon: 35.91,
    tz: 3.0,
    horizonLimit: 15
  },
  filters: {
    galaxies: true,
    nebulae: true,
    clusters: true
  }
};

// Stacking Benchmarks
const SNR_TIERS = {
  tier1: { name: "First Glance", snr: 3.0 },
  tier2: { name: "Decent Picture", snr: 12.0 },
  tier3: { name: "Deep Clean", snr: 25.0 }
};

// Location Presets
const LOCATION_PRESETS = {
  amman: { name: "Amman, Jordan", lat: 31.95, lon: 35.91, tz: 3.0 },
  london: { name: "London, UK", lat: 51.5074, lon: -0.1278, tz: 1.0 },
  newyork: { name: "New York, USA", lat: 40.7128, lon: -74.0060, tz: -4.0 },
  tokyo: { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, tz: 9.0 },
  sydney: { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, tz: 10.0 },
  cairo: { name: "Cairo, Egypt", lat: 30.0444, lon: 31.2357, tz: 3.0 }
};

// Standard Dictionaries
const TYPE_MAP = {
  "galaxy": "Galaxy",
  "emission nebula": "Emission Nebula",
  "planetary nebula": "Planetary Nebula",
  "reflection nebula": "Reflection Nebula",
  "supernova remnant": "Supernova Remnant",
  "open cluster": "Open Cluster",
  "globular cluster": "Globular Cluster"
};

// Hand-curated standard visual surface brightness overrides for Messier/NGC extended objects
// to represent their bright visual cores (preventing massive diffuse dimensions from distorting them)
const SB_OVERRIDES = {
  "M 8": 20.50,      // Lagoon Nebula core
  "M 16": 21.50,     // Eagle Nebula core
  "M 17": 20.00,     // Omega Nebula core
  "M 20": 21.50,     // Trifid Nebula core
  "M 42": 19.50,     // Orion Nebula core
  "M 43": 21.00,     // De Mairan's Nebula
  "M 78": 21.00,     // Orion Reflection Nebula
  "NGC 7000": 21.50, // North America Nebula core
  "NGC 6960": 21.80, // Western Veil Nebula (bright parts)
  "NGC 6992": 21.50, // Eastern Veil Nebula
  "NGC 2237": 22.00, // Rosette Nebula core
  "NGC 1499": 22.00, // California Nebula core
  "IC 1396": 22.50,  // Elephant's Trunk Nebula
  "NGC 3372": 20.00, // Carina Nebula core
  "NGC 3576": 21.00, // Statue of Liberty core
  "NGC 6334": 21.50, // Cat's Paw Nebula
  "NGC 6357": 21.50, // Lobster Nebula
};

// --- DOM ELEMENTS ---
const elements = {
  nightModeToggle: document.getElementById('night-mode-toggle'),
  targetSearch: document.getElementById('target-search'),
  clearSearch: document.getElementById('clear-search'),
  suggestions: document.getElementById('suggestions'),
  
  // Target details
  targetDetails: document.getElementById('target-details'),
  dsoName: document.getElementById('dso-name'),
  dsoCommonName: document.getElementById('dso-common-name'),
  dsoTypeTag: document.getElementById('dso-type-tag'),
  dsoMag: document.getElementById('dso-mag'),
  dsoSb: document.getElementById('dso-sb'),
  dsoDims: document.getElementById('dso-dims'),
  dsoSource: document.getElementById('dso-source'),
  
  // Environment inputs
  bortleScale: document.getElementById('bortle-scale'),
  altitudeSlider: document.getElementById('altitude-slider'),
  altitudeVal: document.getElementById('altitude-val'),
  airmassVal: document.getElementById('airmass-val'),
  subExposure10: document.getElementById('sub-exposure-10'),
  subExposure20: document.getElementById('sub-exposure-20'),
  filterToggle: document.getElementById('filter-toggle'),
  
  // Collapsible hardware profile
  hwAperture: document.getElementById('hw-aperture'),
  hwFocalLength: document.getElementById('hw-focal-length'),
  hwFocalRatioVal: document.getElementById('hw-focal-ratio-val'),
  hwPixelSize: document.getElementById('hw-pixel-size'),
  hwQe: document.getElementById('hw-qe'),
  hwReadNoise: document.getElementById('hw-read-noise'),
  hwDarkCurrent: document.getElementById('hw-dark-current'),
  resetHardware: document.getElementById('reset-hardware'),
  
  // Live results telemetry
  calcSignal: document.getElementById('calc-signal'),
  calcSkyNoise: document.getElementById('calc-sky-noise'),
  stackCondition: document.getElementById('stack-condition'),
  
  // Tiers
  t1Time: document.getElementById('t1-time'),
  t1Frames: document.getElementById('t1-frames'),
  t1Progress: document.getElementById('t1-progress'),
  
  // Decent Picture
  t2Time: document.getElementById('t2-time'),
  t2Frames: document.getElementById('t2-frames'),
  t2Progress: document.getElementById('t2-progress'),
  
  // Deep Clean
  t3Time: document.getElementById('t3-time'),
  t3Frames: document.getElementById('t3-frames'),
  t3Progress: document.getElementById('t3-progress'),

  // Tonight's Best Targets
  obsLocationPreset: document.getElementById('obs-location-preset'),
  obsLat: document.getElementById('obs-lat'),
  obsLon: document.getElementById('obs-lon'),
  btnUseMyloc: document.getElementById('btn-use-myloc'),
  obsHorizonSlider: document.getElementById('obs-horizon-slider'),
  obsHorizonVal: document.getElementById('obs-horizon-val'),
  filterShowGalaxies: document.getElementById('filter-show-galaxies'),
  filterShowNebulae: document.getElementById('filter-show-nebulae'),
  filterShowClusters: document.getElementById('filter-show-clusters'),
  tonightTargetsList: document.getElementById('tonight-targets-list'),
  tonightTimeMeta: document.getElementById('tonight-time-meta'),
};

// --- INITIALIZATION ---
function init() {
  // Set up event listeners
  setupEventListeners();
  
  // Load default target (M31 - Andromeda Galaxy)
  const defaultTarget = dsoCatalog.find(dso => dso.name === "M 31") || dsoCatalog[0];
  setTarget(defaultTarget);
  
  // Initial math calculations
  calculate();
  
  // Initialize Tonight's Targets list
  updateTonightTargets();
  
  // Apply saved night mode preference
  if (localStorage.getItem('nightMode') === 'true') {
    document.body.classList.add('night-mode');
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Night Mode Toggle
  elements.nightModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('night-mode');
    localStorage.setItem('nightMode', document.body.classList.contains('night-mode'));
  });
  
  // Autocomplete Target Search
  elements.targetSearch.addEventListener('input', handleSearchInput);
  elements.targetSearch.addEventListener('focus', handleSearchInput);
  elements.targetSearch.addEventListener('keydown', handleSearchKeydown);
  elements.clearSearch.addEventListener('click', clearSearchInput);
  
  // Hide suggestions dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!elements.targetSearch.contains(e.target) && !elements.suggestions.contains(e.target)) {
      elements.suggestions.style.display = 'none';
    }
  });
  
  // Bortle Scale Dropdown
  elements.bortleScale.addEventListener('change', (e) => {
    state.sqm = parseFloat(e.target.value);
    calculate();
  });
  
  // Altitude Slider
  elements.altitudeSlider.addEventListener('input', (e) => {
    state.altitude = parseInt(e.target.value);
    elements.altitudeVal.textContent = `${state.altitude}°`;
    calculate();
  });
  
  // Sub-exposure radios
  elements.subExposure10.addEventListener('change', () => {
    state.tSub = 10;
    calculate();
  });
  elements.subExposure20.addEventListener('change', () => {
    state.tSub = 20;
    calculate();
  });
  
  // Dual-band filter toggle
  elements.filterToggle.addEventListener('change', (e) => {
    state.filterActive = e.target.checked;
    calculate();
  });
  
  // Collapsible Hardware Profile Inputs
  const hardwareInputs = [
    elements.hwAperture,
    elements.hwFocalLength,
    elements.hwPixelSize,
    elements.hwQe,
    elements.hwReadNoise,
    elements.hwDarkCurrent
  ];
  
  hardwareInputs.forEach(input => {
    input.addEventListener('input', handleHardwareInput);
  });
  
  // Reset Hardware button
  elements.resetHardware.addEventListener('click', () => {
    state.hardware = { ...HARDWARE_DEFAULTS };
    updateHardwareUI();
    calculate();
  });

  // Tonight's controls listeners
  elements.obsLocationPreset.addEventListener('change', (e) => {
    const val = e.target.value;
    state.location.preset = val;
    if (val === 'custom') {
      elements.obsLat.disabled = false;
      elements.obsLon.disabled = false;
    } else {
      const preset = LOCATION_PRESETS[val];
      elements.obsLat.value = preset.lat;
      elements.obsLon.value = preset.lon;
      state.location.lat = preset.lat;
      state.location.lon = preset.lon;
      state.location.tz = preset.tz;
      elements.obsLat.disabled = true;
      elements.obsLon.disabled = true;
    }
    updateTonightTargets();
  });

  elements.obsLat.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= -90 && val <= 90) {
      state.location.lat = val;
      updateTonightTargets();
    }
  });

  elements.obsLon.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= -180 && val <= 180) {
      state.location.lon = val;
      state.location.tz = Math.round(val / 15.0);
      updateTonightTargets();
    }
  });

  elements.obsHorizonSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.location.horizonLimit = val;
    elements.obsHorizonVal.textContent = `${val}°`;
    updateTonightTargets();
  });

  elements.filterShowGalaxies.addEventListener('change', (e) => {
    state.filters.galaxies = e.target.checked;
    updateTonightTargets();
  });
  elements.filterShowNebulae.addEventListener('change', (e) => {
    state.filters.nebulae = e.target.checked;
    updateTonightTargets();
  });
  elements.filterShowClusters.addEventListener('change', (e) => {
    state.filters.clusters = e.target.checked;
    updateTonightTargets();
  });

  elements.btnUseMyloc.addEventListener('click', () => {
    if (navigator.geolocation) {
      const originalText = elements.btnUseMyloc.innerHTML;
      elements.btnUseMyloc.textContent = "Locating...";
      elements.btnUseMyloc.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.location.preset = 'custom';
          elements.obsLocationPreset.value = 'custom';
          
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lon = parseFloat(position.coords.longitude.toFixed(4));
          
          state.location.lat = lat;
          state.location.lon = lon;
          state.location.tz = Math.round(lon / 15.0);
          
          elements.obsLat.value = lat;
          elements.obsLon.value = lon;
          elements.obsLat.disabled = false;
          elements.obsLon.disabled = false;
          
          elements.btnUseMyloc.innerHTML = originalText;
          elements.btnUseMyloc.disabled = false;
          updateTonightTargets();
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Could not retrieve location. Coordinates kept.");
          elements.btnUseMyloc.innerHTML = originalText;
          elements.btnUseMyloc.disabled = false;
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });
}

// --- SEARCH & AUTOCOMPLETE LOGIC ---
let activeSuggestionIndex = -1;

function handleSearchInput(e) {
  const value = e.target.value.trim().toLowerCase();
  
  if (value === "") {
    elements.clearSearch.style.display = 'none';
    elements.suggestions.style.display = 'none';
    return;
  }
  
  elements.clearSearch.style.display = 'block';
  
  // Filter core catalog
  const matches = dsoCatalog.filter(dso => {
    return dso.name.toLowerCase().includes(value) || 
           (dso.commonName && dso.commonName.toLowerCase().includes(value));
  }).slice(0, 10); // Limit to top 10 matches
  
  renderSuggestions(matches, value);
}

function renderSuggestions(matches, query) {
  elements.suggestions.innerHTML = "";
  activeSuggestionIndex = -1;
  
  if (matches.length === 0) {
    // If no local match, offer SIMBAD TAP dynamic search option
    const simbadOption = document.createElement('div');
    simbadOption.className = 'suggestion-item simbad-search-option';
    simbadOption.innerHTML = `
      <div class="s-names">
        <span class="s-name">Search SIMBAD TAP fallback for "${elements.targetSearch.value}"</span>
        <span class="s-common">Queries CDS databases in Strasbourg, France</span>
      </div>
      <span class="s-type" style="background: rgba(245, 158, 11, 0.1); color: var(--accent-amber); border-color: rgba(245, 158, 11, 0.25);">API Query</span>
    `;
    
    simbadOption.addEventListener('click', () => {
      triggerSimbadFallback(elements.targetSearch.value);
    });
    
    elements.suggestions.appendChild(simbadOption);
  } else {
    // Render local matches
    matches.forEach((match, idx) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = idx;
      
      const typeClass = getDsoTypeClass(match.type);
      
      item.innerHTML = `
        <div class="s-names">
          <span class="s-name">${match.name}</span>
          <span class="s-common">${match.commonName || 'No common name'}</span>
        </div>
        <span class="s-type ${typeClass}">${match.type}</span>
      `;
      
      item.addEventListener('click', () => {
        setTarget(match);
        elements.suggestions.style.display = 'none';
      });
      
      elements.suggestions.appendChild(item);
    });
  }
  
  elements.suggestions.style.display = 'block';
}

function handleSearchKeydown(e) {
  const items = elements.suggestions.querySelectorAll('.suggestion-item');
  if (items.length === 0) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
    highlightSuggestion(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeSuggestionIndex > -1 && activeSuggestionIndex < items.length) {
      items[activeSuggestionIndex].click();
    } else {
      // Trigger search/simbad fallback directly on enter if not highlighted
      const value = elements.targetSearch.value.trim();
      if (value !== "") {
        // Check if there is an exact name match locally first
        const localMatch = dsoCatalog.find(dso => dso.name.toLowerCase() === value.toLowerCase() || (dso.commonName && dso.commonName.toLowerCase() === value.toLowerCase()));
        if (localMatch) {
          setTarget(localMatch);
          elements.suggestions.style.display = 'none';
        } else {
          triggerSimbadFallback(value);
        }
      }
    }
  } else if (e.key === 'Escape') {
    elements.suggestions.style.display = 'none';
  }
}

function highlightSuggestion(items) {
  items.forEach((item, idx) => {
    if (idx === activeSuggestionIndex) {
      item.classList.add('highlighted');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('highlighted');
    }
  });
}

function clearSearchInput() {
  elements.targetSearch.value = "";
  elements.clearSearch.style.display = 'none';
  elements.suggestions.style.display = 'none';
  elements.targetSearch.focus();
}

function getDsoTypeClass(type) {
  const t = type.toLowerCase();
  if (t.includes('galaxy')) return 'type-galaxy';
  if (t.includes('nebula') || t.includes('remnant')) return 'type-nebula';
  if (t.includes('cluster')) return 'type-cluster';
  return 'type-other';
}

function setTarget(dso) {
  state.target = dso;
  elements.targetSearch.value = dso.name;
  
  // Update Target Info UI
  elements.dsoName.textContent = dso.name;
  elements.dsoCommonName.textContent = dso.commonName || 'No common name';
  elements.dsoTypeTag.textContent = dso.type;
  elements.dsoTypeTag.className = `dso-type-tag ${getDsoTypeClass(dso.type)}`;
  elements.dsoMag.textContent = dso.mag !== null ? dso.mag.toFixed(2) : '--';
  elements.dsoSb.innerHTML = `${dso.sb.toFixed(2)} <small>mag/arcsec²</small>`;
  elements.dsoDims.textContent = `${dso.dimensions.maj.toFixed(1)}' x ${dso.dimensions.min.toFixed(1)}'`;
  
  if (dso.source === 'simbad') {
    elements.dsoSource.textContent = "SIMBAD Fallback";
    elements.dsoSource.className = "value source-simbad";
  } else if (dso.source === 'simbad_est') {
    elements.dsoSource.textContent = "SIMBAD (Est. Mag)";
    elements.dsoSource.className = "value source-simbad-est";
  } else {
    elements.dsoSource.textContent = "Core Catalog";
    elements.dsoSource.className = "value source-local";
  }
  
  // Auto-toggle Dual-Band Filter for Emission/Planetary Nebulae and Remnants
  const isNebula = dso.type.toLowerCase().includes('nebula') || dso.type.toLowerCase().includes('remnant');
  if (isNebula) {
    elements.filterToggle.checked = true;
    state.filterActive = true;
  } else {
    elements.filterToggle.checked = false;
    state.filterActive = false;
  }
  
  calculate();
}

// --- DYNAMIC SIMBAD TAP API FALLBACK ---
async function triggerSimbadFallback(query) {
  elements.suggestions.style.display = 'none';
  elements.dsoName.textContent = "Searching...";
  elements.dsoCommonName.textContent = "Querying SIMBAD TAP fallback database...";
  elements.dsoTypeTag.textContent = "Pending";
  elements.dsoTypeTag.className = "dso-type-tag type-other";
  
  // Format query names for SIMBAD cross-identifications lookup
  const cleanQuery = query.trim().toUpperCase();
  const trimmed = query.trim();
  const rawNames = [trimmed];
  
  // Try adding a space for catalog tags (e.g. M31 -> M 31, NGC7000 -> NGC 7000)
  const spaceMatch = trimmed.match(/^([A-Za-z]+)(\d+)$/);
  if (spaceMatch) {
    rawNames.push(`${spaceMatch[1]} ${spaceMatch[2]}`);
    rawNames.push(`${spaceMatch[1]}  ${spaceMatch[2]}`); // double space just in case
  }
  
  // Also try removing spaces (e.g. NGC 7000 -> NGC7000)
  const removeSpace = trimmed.replace(/\s+/g, '');
  if (removeSpace !== trimmed) {
    rawNames.push(removeSpace);
  }
  
  // Generate casing combinations in JS to avoid using LOWER() in ADQL
  const searchNamesSet = new Set();
  rawNames.forEach(name => {
    searchNamesSet.add(name);
    searchNamesSet.add(name.toLowerCase());
    searchNamesSet.add(name.toUpperCase());
    // Title Case (e.g., "lagoon nebula" -> "Lagoon Nebula")
    const title = name.replace(/\b\w/g, c => c.toUpperCase());
    searchNamesSet.add(title);
    // Sentence Case (e.g., "Lagoon nebula")
    const sentence = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    searchNamesSet.add(sentence);
  });
  
  const searchNames = Array.from(searchNamesSet);
  const idsStr = searchNames.map(n => `'${n}'`).join(',');
  
  // Construct the ADQL query using full table names to ensure maximum parser safety
  const adqlQuery = `
    SELECT DISTINCT main_id, otype, ra, dec, galdim_majaxis, galdim_minaxis, flux, filter
    FROM basic
    JOIN ident ON basic.oid = ident.oidref
    LEFT JOIN flux ON basic.oid = flux.oidref AND flux.filter IN ('V', 'B', 'G', 'R')
    WHERE ident.id IN (${idsStr})
  `;
  
  const url = "https://simbad.u-strasbg.fr/simbad/sim-tap/sync";
  const params = new URLSearchParams();
  params.append('request', 'doQuery');
  params.append('lang', 'ADQL');
  params.append('format', 'json');
  params.append('query', adqlQuery);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CosmoStackCalculator/1.0'
      },
      body: params
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const parsedTarget = parseSimbadTAPResponse(result, cleanQuery);
    
    if (parsedTarget) {
      setTarget(parsedTarget);
    } else {
      showFallbackError(`Object "${query}" not found in SIMBAD.`);
    }
  } catch (error) {
    console.error('SIMBAD fetch failed:', error);
    showFallbackError("API Connection Timeout/Error.");
  }
}

function parseSimbadTAPResponse(results, queryName) {
  if (!results || !results.metadata || !results.data || results.data.length === 0) {
    return null;
  }
  
  const colNames = results.metadata.map(c => c.name);
  const idxMainId = colNames.indexOf("main_id");
  const idxOtype = colNames.indexOf("otype");
  const idxRa = colNames.indexOf("ra");
  const idxDec = colNames.indexOf("dec");
  const idxMaj = colNames.indexOf("galdim_majaxis");
  const idxMin = colNames.indexOf("galdim_minaxis");
  const idxFlux = colNames.indexOf("flux");
  const idxFilter = colNames.indexOf("filter");
  
  // Group rows (since left joining flux returns a row per filter)
  const mainId = results.data[0][idxMainId];
  const otype = results.data[0][idxOtype] || "Other";
  const raVal = idxRa !== -1 ? results.data[0][idxRa] : null;
  const decVal = idxDec !== -1 ? results.data[0][idxDec] : null;
  
  // Find V, G, B, R magnitudes
  const fluxes = {};
  let majVal = null;
  let minVal = null;
  
  results.data.forEach(row => {
    const flux = row[idxFlux];
    const filt = row[idxFilter];
    if (flux !== null && filt) {
      fluxes[filt] = parseFloat(flux);
    }
    if (row[idxMaj] !== null && majVal === null) majVal = parseFloat(row[idxMaj]);
    if (row[idxMin] !== null && minVal === null) minVal = parseFloat(row[idxMin]);
  });
  
  // Pick best magnitude
  let mag = null;
  for (const f_band of ["V", "G", "B", "R"]) {
    if (f_band in fluxes) {
      mag = fluxes[f_band];
      break;
    }
  }
  if (mag === null && Object.keys(fluxes).length > 0) {
    mag = Object.values(fluxes)[0];
  }
  
  // Resolve dimensions (already in arcminutes in SIMBAD galdim columns)
  let maj_arcmin = 2.0;
  let min_arcmin = 2.0;
  if (majVal !== null && majVal > 0) {
    maj_arcmin = majVal;
  }
  if (minVal !== null && minVal > 0) {
    min_arcmin = minVal;
  } else {
    min_arcmin = maj_arcmin;
  }
  
  let isEstimatedMag = false;
  let finalSb;
  
  if (mag === null) {
    // Fallback: estimate surface brightness based on object type
    let defaultSb = 21.8;
    const ot = otype.toLowerCase();
    if (ot.includes('galaxy') || ot === 'g') defaultSb = 22.4;
    else if (ot.includes('nebula') || ot.includes('hii') || ot.includes('remnant') || ot === 'pn' || ot === 'snr') defaultSb = 21.5;
    else if (ot.includes('cluster') || ot === 'cl' || ot === 'opc' || ot === 'glc') defaultSb = 20.0;
    
    finalSb = defaultSb;
    const area_arcsec2 = Math.PI * (maj_arcmin * min_arcmin / 4.0) * 3600.0;
    mag = defaultSb - 2.5 * Math.log10(area_arcsec2);
    isEstimatedMag = true;
  } else {
    const area_arcsec2 = Math.PI * (maj_arcmin * min_arcmin / 4.0) * 3600.0;
    finalSb = mag + 2.5 * Math.log10(area_arcsec2);
  }
  
  // Map otype
  let standardType = "Emission Nebula"; // fallback
  const ot = otype.toLowerCase();
  if (ot.includes('galaxy') || ot === 'g') standardType = "Galaxy";
  else if (ot.includes('planetary') || ot === 'pn') standardType = "Planetary Nebula";
  else if (ot.includes('emission') || ot.includes('hii')) standardType = "Emission Nebula";
  else if (ot.includes('reflection') || ot === 'rfn') standardType = "Reflection Nebula";
  else if (ot.includes('remnant') || ot === 'snr') standardType = "Supernova Remnant";
  else if (ot.includes('globular') || ot === 'glc') standardType = "Globular Cluster";
  else if (ot.includes('open') || ot === 'opc') standardType = "Open Cluster";
  
  // Normalize Main ID spacing
  const parts = mainId.split(/\s+/);
  const cleanMainId = parts.join(' ');
  
  // Apply standard visual core surface brightness overrides if present
  if (SB_OVERRIDES[cleanMainId]) {
    finalSb = SB_OVERRIDES[cleanMainId];
  }
  
  return {
    name: cleanMainId,
    commonName: queryName !== cleanMainId ? queryName : "",
    type: standardType,
    mag: mag,
    dimensions: {
      maj: maj_arcmin,
      min: min_arcmin
    },
    sb: finalSb,
    ra: raVal,
    dec: decVal,
    source: isEstimatedMag ? "simbad_est" : "simbad"
  };
}

function showFallbackError(message) {
  elements.dsoName.textContent = "Error";
  elements.dsoCommonName.textContent = message;
  elements.dsoTypeTag.textContent = "Failed";
  elements.dsoTypeTag.className = "dso-type-tag type-other";
  elements.dsoMag.textContent = "--";
  elements.dsoSb.innerHTML = "-- <small>mag/arcsec²</small>";
  elements.dsoDims.textContent = "--";
}

// --- HARDWARE INPUT LOGIC ---
function handleHardwareInput() {
  const aperture = parseFloat(elements.hwAperture.value) || HARDWARE_DEFAULTS.aperture;
  const focalLength = parseFloat(elements.hwFocalLength.value) || HARDWARE_DEFAULTS.focalLength;
  const pixelSize = parseFloat(elements.hwPixelSize.value) || HARDWARE_DEFAULTS.pixelSize;
  const qe = parseFloat(elements.hwQe.value) || HARDWARE_DEFAULTS.qe;
  const readNoise = parseFloat(elements.hwReadNoise.value) || HARDWARE_DEFAULTS.readNoise;
  const darkCurrent = parseFloat(elements.hwDarkCurrent.value) || HARDWARE_DEFAULTS.darkCurrent;
  
  state.hardware = {
    aperture,
    focalLength,
    pixelSize,
    qe,
    readNoise,
    darkCurrent
  };
  
  // Recalculate Focal Ratio: f = F / D
  const focalRatio = focalLength / aperture;
  elements.hwFocalRatioVal.textContent = focalRatio.toFixed(2);
  
  calculate();
}

function updateHardwareUI() {
  elements.hwAperture.value = state.hardware.aperture;
  elements.hwFocalLength.value = state.hardware.focalLength;
  elements.hwPixelSize.value = state.hardware.pixelSize;
  elements.hwQe.value = state.hardware.qe;
  elements.hwReadNoise.value = state.hardware.readNoise;
  elements.hwDarkCurrent.value = state.hardware.darkCurrent;
  
  const focalRatio = state.hardware.focalLength / state.hardware.aperture;
  elements.hwFocalRatioVal.textContent = focalRatio.toFixed(2);
}

// --- MATHEMATICAL ENGINE & CALCULATION ---
function calculate() {
  if (!state.target) return;
  
  const hw = state.hardware;
  const target = state.target;
  const sqm = state.sqm;
  const altitude = state.altitude;
  const tSub = state.tSub;
  const filterActive = state.filterActive;
  
  // 1. Calculate Focal Ratio f
  const f = hw.focalLength / hw.aperture;
  
  // 2. Calculate Airmass X
  const altitudeRad = altitude * Math.PI / 180.0;
  const airmass = 1.0 / Math.sin(altitudeRad);
  elements.airmassVal.textContent = `Airmass: ${airmass.toFixed(2)}x`;
  
  // Check if target is a Nebula (for filter mapping)
  const isNebula = target.type.toLowerCase().includes('nebula') || target.type.toLowerCase().includes('remnant');
  
  // 3. Calibration system constant (K_sys)
  const K_sys = 0.20;
  const qeFraction = hw.qe / 100.0;
  
  // Linear visual perception compression on surface brightness (gamma = 0.63)
  const sbMin = 18.0;
  const gamma = 0.63;
  const sbEff = target.sb < sbMin ? target.sb : sbMin + (target.sb - sbMin) * gamma;
  
  // 4. Calculate Object Signal rate S (electrons/pixel/second)
  // S0 is the unattenuated zenith signal rate using effective compressed SB
  const S_0 = K_sys * qeFraction * ((hw.pixelSize * hw.pixelSize) / (f * f)) * Math.pow(10, -0.4 * (sbEff - 22.0));
  
  // Apply atmospheric extinction (attenuation: 10^(-0.4 * k * X)) where k = 0.20
  const k_ext = 0.20;
  let S = S_0 * Math.pow(10, -0.4 * k_ext * airmass);
  
  // 5. Calculate Sky Background rate B_sky (electrons/pixel/second)
  // B0 is the zenith sky background rate
  const B_sky_0 = K_sys * qeFraction * ((hw.pixelSize * hw.pixelSize) / (f * f)) * Math.pow(10, -0.4 * (sqm - 22.0));
  
  // Apply airmass scaling (sky background grows brighter as airmass increases)
  let B_sky = B_sky_0 * airmass;
  
  // 6. Apply filter coefficients if active and target is a Nebula
  if (filterActive && isNebula) {
    S *= 0.80;        // 80% transmission of H-alpha/OIII signals
    B_sky *= 0.10;    // 90% reduction of light pollution/sky background
  }
  
  // Update live sensor rates
  elements.calcSignal.textContent = S.toFixed(5);
  elements.calcSkyNoise.textContent = B_sky.toFixed(5);
  
  // Stacking status message
  if (B_sky > 5 * S) {
    elements.stackCondition.textContent = "Sky-Noise Dominated";
    elements.stackCondition.className = "badge info alert-yellow";
  } else if (B_sky <= 5 * S && B_sky > S) {
    elements.stackCondition.textContent = "Balanced Sky/Signal";
    elements.stackCondition.className = "badge info alert-cyan";
  } else {
    elements.stackCondition.textContent = "Signal Dominated";
    elements.stackCondition.className = "badge info alert-green";
  }
  
  // 7. Calculate Stacking time for Tiers
  // Noise per second equation: N_total = sqrt(S + B_sky + I_d + (N_r^2 / t_sub))
  const noiseTerm = S + B_sky + hw.darkCurrent + ((hw.readNoise * hw.readNoise) / tSub);
  
  // Calculate T_total in seconds: T = (SNR * N_total / S)^2
  const calcTTotal = (snr) => {
    if (S <= 0) return Infinity;
    return Math.pow((snr * Math.sqrt(noiseTerm)) / S, 2);
  };
  
  const T1 = calcTTotal(SNR_TIERS.tier1.snr);
  const T2 = calcTTotal(SNR_TIERS.tier2.snr);
  const T3 = calcTTotal(SNR_TIERS.tier3.snr);
  
  // Format displays
  updateTierUI(1, T1, tSub, elements.t1Time, elements.t1Frames);
  updateTierUI(2, T2, tSub, elements.t2Time, elements.t2Frames);
  updateTierUI(3, T3, tSub, elements.t3Time, elements.t3Frames);
  
  // Update relative progress bars (relative to Tier 3 which is 100%)
  if (T3 !== Infinity && T3 > 0) {
    elements.t1Progress.style.width = `${Math.min(100, (T1 / T3) * 100)}%`;
    elements.t2Progress.style.width = `${Math.min(100, (T2 / T3) * 100)}%`;
    elements.t3Progress.style.width = `100%`;
  } else {
    elements.t1Progress.style.width = `0%`;
    elements.t2Progress.style.width = `0%`;
    elements.t3Progress.style.width = `0%`;
  }

  // Programmatically refresh recommendation list when environment, filter, or target changes
  updateTonightTargets();
}

function updateTierUI(tierNum, totalSeconds, tSub, timeElem, frameElem) {
  if (totalSeconds === Infinity || isNaN(totalSeconds)) {
    timeElem.textContent = "--";
    frameElem.textContent = "-- frames";
    return;
  }
  
  // Format time
  let timeStr = "";
  if (totalSeconds < 60) {
    timeStr = `${Math.round(totalSeconds)}s`;
  } else if (totalSeconds < 3600) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    timeStr = `${mins}m ${secs}s`;
  } else {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.round((totalSeconds % 3600) / 60);
    timeStr = `${hrs}h ${mins}m`;
  }
  
  timeElem.textContent = timeStr;
  
  // Format frame counts
  const frames = Math.ceil(totalSeconds / tSub);
  frameElem.textContent = `${frames.toLocaleString()} frames`;
}

// Start the app when DOM loads
window.addEventListener('DOMContentLoaded', init);

// --- ASTRONOMICAL COORDINATE CALCULATIONS ---
function getJulianDate(date) {
  return (date.getTime() / 86400000.0) + 2440587.5;
}

function getGMST(jd) {
  const D = jd - 2451545.0;
  let gmst = (280.46061837 + 360.98564736629 * D) % 360;
  if (gmst < 0) gmst += 360;
  return gmst;
}

function getAltAz(ra, dec, lat, lon, date) {
  const jd = getJulianDate(date);
  const gmst = getGMST(jd);
  const lst = (gmst + lon) % 360;
  
  let ha = (lst - ra) * Math.PI / 180.0;
  const latRad = lat * Math.PI / 180.0;
  const decRad = dec * Math.PI / 180.0;
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const alt = altRad * 180.0 / Math.PI;
  
  const cosAlt = Math.cos(altRad);
  let az = 0.0;
  if (cosAlt > 0.0001) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
    const sinAz = -Math.sin(ha) * Math.cos(decRad) / cosAlt;
    az = Math.atan2(sinAz, cosAz) * 180.0 / Math.PI;
    if (az < 0) az += 360;
  } else {
    az = 180.0;
  }
  
  return { alt, az };
}

// Estimate required Decent Picture stacking time helper (SNR = 12.0)
function estimateDecentPictureTime(dso, sqm, altitude, tSub) {
  if (dso.sb === undefined || dso.sb === null) return Infinity;
  
  const hw = state.hardware;
  const f = hw.focalLength / hw.aperture;
  
  // Airmass X
  const altitudeRad = altitude * Math.PI / 180.0;
  const airmass = 1.0 / Math.sin(altitudeRad);
  
  // Compression (gamma = 0.63)
  const sbMin = 18.0;
  const gamma = 0.63;
  const sbEff = dso.sb < sbMin ? dso.sb : sbMin + (dso.sb - sbMin) * gamma;
  
  // Signal S
  const K_sys = 0.20;
  const qeFraction = hw.qe / 100.0;
  const S_0 = K_sys * qeFraction * ((hw.pixelSize * hw.pixelSize) / (f * f)) * Math.pow(10, -0.4 * (sbEff - 22.0));
  const k_ext = 0.20;
  let S = S_0 * Math.pow(10, -0.4 * k_ext * airmass);
  
  // Sky noise B_sky
  const B_sky_0 = K_sys * qeFraction * ((hw.pixelSize * hw.pixelSize) / (f * f)) * Math.pow(10, -0.4 * (sqm - 22.0));
  let B_sky = B_sky_0 * airmass;
  
  // Filter active logic
  const isNebula = dso.type.toLowerCase().includes('nebula') || dso.type.toLowerCase().includes('remnant');
  const filterActiveForThisDso = state.filterActive && isNebula;
  if (filterActiveForThisDso) {
    S *= 0.80;
    B_sky *= 0.10;
  }
  
  const noiseTerm = S + B_sky + hw.darkCurrent + ((hw.readNoise * hw.readNoise) / tSub);
  const snr = 12.0; // Decent Picture SNR
  if (S <= 0) return Infinity;
  return Math.pow((snr * Math.sqrt(noiseTerm)) / S, 2);
}

// Format local time at target
function formatTargetLocalTime(utcTimeMs, targetTzOffsetHours) {
  const date = new Date(utcTimeMs + targetTzOffsetHours * 3600 * 1000);
  const hrs = String(date.getUTCHours()).padStart(2, '0');
  const mins = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
}

// Format duration helper
function formatDuration(totalSeconds) {
  if (totalSeconds === Infinity || isNaN(totalSeconds)) return "--";
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  if (totalSeconds < 3600) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// Scan visibility and parameters for all targets tonight
let lastTonightUpdateMs = 0; // Throttle rendering to avoid lags during rapid slider dragging
function updateTonightTargets() {
  const nowTime = Date.now();
  if (nowTime - lastTonightUpdateMs < 100) {
    // Throttled refresh
    clearTimeout(state._tonightTimer);
    state._tonightTimer = setTimeout(updateTonightTargets, 100);
    return;
  }
  lastTonightUpdateMs = nowTime;

  if (!dsoCatalog || dsoCatalog.length === 0) return;
  
  const lat = parseFloat(state.location.lat);
  const lon = parseFloat(state.location.lon);
  const preset = state.location.preset;
  const targetTz = preset === 'custom' ? Math.round(lon / 15.0) : LOCATION_PRESETS[preset].tz;
  const horizonLimit = state.location.horizonLimit;
  
  const now = new Date();
  
  // Align now to nearest 20-minute mark
  const nearest20Date = new Date(now);
  const minutes = nearest20Date.getMinutes();
  const roundedMin = Math.round(minutes / 20) * 20;
  nearest20Date.setMinutes(roundedMin, 0, 0);
  const nearest20Ms = nearest20Date.getTime();
  
  // Calculate 12 hours local night window bounds (for overall visibility calculations)
  const targetLocalTime = new Date(now.getTime() + targetTz * 3600 * 1000);
  const targetDuskLocal = new Date(Date.UTC(
    targetLocalTime.getUTCFullYear(),
    targetLocalTime.getUTCMonth(),
    targetLocalTime.getUTCDate(),
    18, 0, 0
  ));
  const startOfNightUtcMs = targetDuskLocal.getTime() - targetTz * 3600 * 1000;
  
  const samplePoints = [];
  for (let i = 0; i <= 48; i++) {
    samplePoints.push(startOfNightUtcMs + i * 15 * 60 * 1000);
  }
  
  // Format metadata header label
  elements.tonightTimeMeta.textContent = `Center Time: ${formatTargetLocalTime(now.getTime(), targetTz)} (UTC${targetTz >= 0 ? '+' : ''}${targetTz})`;
  
  // Filter the catalog for "nice stuff and beautiful stuff only"
  const niceCatalog = dsoCatalog.filter(dso => {
    // 1. Messier objects
    const isMessier = dso.name.startsWith('M ') && !isNaN(parseInt(dso.name.substring(2)));
    // 2. Objects with common names
    const hasCommonName = !!dso.commonName;
    // 3. Bright objects (apparent magnitude < 11.5)
    const isBright = dso.mag !== null && dso.mag < 11.5;
    
    return isMessier || hasCommonName || isBright;
  });

  const bestTargets = [];
  
  // Scan 73 slots from -36 to +36 (covering previous 12h and next 12h at 20-minute steps)
  for (let offset = -36; offset <= 36; offset++) {
    const slotTimeMs = nearest20Ms + offset * 20 * 60 * 1000;
    const slotDate = new Date(slotTimeMs);
    
    let bestDso = null;
    let maxAlt = -90;
    
    niceCatalog.forEach(dso => {
      if (dso.ra === undefined || dso.dec === undefined || dso.ra === null || dso.dec === null) return;
      
      // Type checkbox filters
      const type = dso.type.toLowerCase();
      const isGalaxy = type.includes('galaxy');
      const isNebula = type.includes('nebula') || type.includes('remnant');
      const isCluster = type.includes('cluster');
      
      if (isGalaxy && !state.filters.galaxies) return;
      if (isNebula && !state.filters.nebulae) return;
      if (isCluster && !state.filters.clusters) return;
      
      // Calculate altitude at this slot's time
      const { alt } = getAltAz(dso.ra, dso.dec, lat, lon, slotDate);
      if (alt > maxAlt) {
        maxAlt = alt;
        bestDso = dso;
      }
    });
    
    if (bestDso && maxAlt >= horizonLimit) {
      // Calculate overall visibility window for this best target
      const visibleWindowStr = getDsoVisibleWindow(bestDso, lat, lon, startOfNightUtcMs, samplePoints, horizonLimit, targetTz);
      
      bestTargets.push({
        dso: bestDso,
        altAtSlot: maxAlt,
        slotTimeMs,
        offsetSlots: offset,
        visibleWindowStr
      });
    }
  }
  
  // De-duplicate: Group by DSO name and keep the occurrence closest to 90 degrees (highest altitude)
  const uniqueTargetsMap = new Map();
  bestTargets.forEach(item => {
    const existing = uniqueTargetsMap.get(item.dso.name);
    if (!existing || item.altAtSlot > existing.altAtSlot) {
      uniqueTargetsMap.set(item.dso.name, item);
    }
  });
  const uniqueTargets = Array.from(uniqueTargetsMap.values());

  // Sort from closest time offset to farthest (offset slots closer to 0 is first)
  uniqueTargets.sort((a, b) => {
    return Math.abs(a.offsetSlots) - Math.abs(b.offsetSlots);
  });
  
  // Render targets
  renderTonightTargets(uniqueTargets, targetTz);
}

// Get DSO overall visible window tonight
function getDsoVisibleWindow(dso, lat, lon, startOfNightUtcMs, samplePoints, horizonLimit, targetTz) {
  let visibleStartIdx = -1;
  let visibleEndIdx = -1;
  
  for (let i = 0; i < samplePoints.length; i++) {
    const tMs = samplePoints[i];
    const { alt } = getAltAz(dso.ra, dso.dec, lat, lon, new Date(tMs));
    if (alt >= horizonLimit) {
      if (visibleStartIdx === -1) {
        visibleStartIdx = i;
      }
      visibleEndIdx = i;
    }
  }
  
  if (visibleStartIdx === -1) return "Below horizon";
  if (visibleStartIdx === 0 && visibleEndIdx === 48) return "All Night";
  
  const riseLocal = formatTargetLocalTime(samplePoints[visibleStartIdx], targetTz);
  const setLocal = formatTargetLocalTime(samplePoints[visibleEndIdx], targetTz);
  
  if (visibleStartIdx === 0) return `Dusk to ${setLocal}`;
  if (visibleEndIdx === 48) return `${riseLocal} to Dawn`;
  return `${riseLocal} to ${setLocal}`;
}

function renderTonightTargets(visibleList, targetTz) {
  if (!elements.tonightTargetsList) return;
  elements.tonightTargetsList.innerHTML = "";
  
  if (visibleList.length === 0) {
    elements.tonightTargetsList.innerHTML = `
      <tr>
        <td colspan="8" class="placeholder-row">No visible objects found above the horizon cutoff in the 24h window.</td>
      </tr>
    `;
    return;
  }
  
  visibleList.forEach(item => {
    const dso = item.dso;
    const isActive = state.target && state.target.name === dso.name;
    const tr = document.createElement('tr');
    if (isActive) {
      tr.className = 'active-row';
    }
    
    const typeClass = getDsoTypeClass(dso.type);
    const magDisp = dso.mag !== null ? dso.mag.toFixed(2) : '--';
    const sbDisp = dso.sb !== null ? `${dso.sb.toFixed(1)}` : '--';
    
    // Estimate exposure at that specific slot's altitude
    const estSeconds = estimateDecentPictureTime(dso, state.sqm, item.altAtSlot, state.tSub);
    const timeFormatted = formatDuration(estSeconds);
    
    // Relative offset label in hours/minutes
    let relTimeStr = "";
    const offsetMins = item.offsetSlots * 20;
    if (offsetMins === 0) {
      relTimeStr = "Now";
    } else if (offsetMins > 0) {
      const hrs = Math.floor(offsetMins / 60);
      const mins = offsetMins % 60;
      let parts = [];
      if (hrs > 0) parts.push(`${hrs}h`);
      if (mins > 0) parts.push(`${mins}m`);
      relTimeStr = `in ${parts.join(' ')}`;
    } else {
      const absMins = Math.abs(offsetMins);
      const hrs = Math.floor(absMins / 60);
      const mins = absMins % 60;
      let parts = [];
      if (hrs > 0) parts.push(`${hrs}h`);
      if (mins > 0) parts.push(`${mins}m`);
      relTimeStr = `${parts.join(' ')} ago`;
    }
    
    const slotTimeStr = formatTargetLocalTime(item.slotTimeMs, targetTz);
    
    tr.innerHTML = `
      <td style="font-weight: 600;">
        ${dso.name}
        <div style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;">${dso.commonName || ''}</div>
      </td>
      <td><span class="s-type ${typeClass}" style="margin: 0; padding: 0.15rem 0.5rem; font-size: 0.75rem;">${dso.type}</span></td>
      <td>${magDisp}</td>
      <td>${sbDisp} <small style="font-size: 0.75rem; color: var(--text-secondary);">mag/arcsec²</small></td>
      <td>
        <strong>${item.altAtSlot.toFixed(0)}°</strong> 
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
          ${slotTimeStr} <span style="color: var(--accent-cyan); font-weight: 500;">(${relTimeStr})</span>
        </div>
      </td>
      <td><span class="badge secondary" style="margin: 0; padding: 0.25rem 0.5rem; font-size: 0.8rem;">${item.visibleWindowStr}</span></td>
      <td style="font-weight: 700; color: ${estSeconds === Infinity ? 'var(--text-secondary)' : 'var(--text)'};">
        ${timeFormatted}
      </td>
      <td>
        <button class="btn-select-target" data-name="${dso.name}">Select</button>
      </td>
    `;
    
    // Bind target select click
    tr.querySelector('.btn-select-target').addEventListener('click', () => {
      const match = dsoCatalog.find(obj => obj.name === dso.name);
      if (match) {
        setTarget(match);
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Highlight active row in recommendation list
        updateTonightTargets();
      }
    });
    
    elements.tonightTargetsList.appendChild(tr);
  });
}
