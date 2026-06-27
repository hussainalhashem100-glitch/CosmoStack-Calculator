# CosmoStack Exposure & Stacking Calculator

CosmoStack is a client-side Single Page Application (SPA) designed to calculate required stacking times to reach three quality integration tiers for deep-sky objects (DSOs) using smart telescopes, with the **Seestar S30 Pro** as the baseline hardware profile.

## 🚀 Live Site
The application is live and hosted on Netlify: **[https://cosmostack-calculator.netlify.app](https://cosmostack-calculator.netlify.app)**

---

## ✨ Features

1. **Tonight's Best Targets Panel**:
   * **Advanced Planning**: Select any calendar Date and 24-hour Start Time (e.g. `22:30`) to plan observations in the future.
   * **Start-Time Projections & Sorting**: Projects DSO horizontal Alt/Az coordinates at the exact chosen start time (accounting for the target's timezone offset) and sorts targets descending by altitude at that moment.
   * **Horizon & Azimuth Range Filters**: Filters targets by minimum/maximum altitude (using range sliders) and azimuth range, with full wrap-around support (e.g. `340°` to `30°` correctly includes azimuths between 340° and 360°, and 0° and 30°).
   * **Interactive Compass Widget**: A 3x3 compass sector grid (N, NE, E, SE, S, SW, W, NW, All) for quick one-click azimuth range configurations.
   * **Trend State Badges**: Identifies whether each target is rising, falling, or stable at the chosen start time.

2. **Astronomical Night & Twilight warning (Isha/Fajr)**:
   * **24-Hour Sun Scan**: Scans the 24-hour night cycle in 5-minute steps to find exact twilight crossings.
   * **Isha & Fajr Calculations**: Calculates when the Sun sinks below $-18^\circ$ (Isha / Astronomical Night starts) and rises back above $-18^\circ$ (Fajr / Astronomical Night ends) via linear interpolation.
   * **Warning Banner**: Warns the user dynamically if their chosen time is in Daytime (red), Civil/Nautical/Astronomical Twilight (yellow), or confirms they are in the perfect dark window (green) with local HH:MM times.

3. **Mobile-First Redesign (iPhone 15 Optimized)**:
   * Overhauled layout with responsive media queries for screens under 600px/400px.
   * Stacks recommendation filters vertically with large, touch-friendly inputs.
   * Stacks Tonight's target table rows into individual glassmorphic cards with key-value grid alignments and full-width selection buttons.
   * Preserves side-by-side Live Sensor Telemetry on portrait screens to maximize vertical real estate.

4. **Expanded Local Catalog (1,846 DSOs)**:
   * Local catalog database expanded to **1,846 targets** by incorporating a hand-curated list of 41 iconic nebulae (e.g., North America, Pelican, Heart, Soul, Sadr Region, Witch Head) that lack standard SIMBAD V-band fluxes and were previously omitted.

5. **SCOTOPIC Night Vision Mode**:
   * A monochrome, deep-red theme overlay to preserve observers' dark-adapted vision during field usage. Fits all layout structures, card borders, and warning banners.

6. **Live Sensor Telemetry badge**:
   * Shows real-time estimated object signal ($S$) vs sky background rate ($B_{\text{sky}}$) in $e^{-}/\text{pixel}/\text{sec}$. Shows stacking badges like `Sky-Noise Dominated` or `Signal Dominated`.

7. **Dynamic SIMBAD TAP Fallback**:
   * Integrates an async query client directly to the professional Strasbourg astronomical database (CDS SIMBAD TAP API). If an object is not in the local database, it capitalizes and searches `ident.id` on-the-fly and calculates surface brightness.

8. **Linear Visual Perception Stacking Model**:
   * Calibrated using a linear compression factor ($\gamma = 0.63$) on surface brightness ($S_{b,\text{eff}} = 18.0 + (S_b - 18.0) \times 0.63$) to realistically scale stacking times for bright and faint DSOs.

---

## 🧮 Mathematical Engine

CosmoStack's exposure calculator is built upon physical and astronomical equations:

### 1. Airmass calculation
Calculates the atmospheric path length of light:
$$X = \frac{1}{\sin(\theta)}$$
*Where $\theta$ is the altitude angle in degrees.*

### 2. Atmospheric Extinction
Attenuates the object's signal based on its airmass:
$$S = S_0 \times 10^{-0.4 \cdot k \cdot X}$$
*Where $k = 0.20$ is the extinction coefficient.*

### 3. Sky Background Rate
Scales the zenith sky background with airmass:
$$B_{\text{sky}} = B_{\text{sky}, 0} \times X$$

### 4. Noise Per Second
Combines read noise ($N_r$), dark current ($I_d$), and signals:
$$N_{\text{total}} = \sqrt{S + B_{\text{sky}} + I_d + \frac{N_r^2}{t_{\text{sub}}}}$$

### 5. Stacking Tiers
Calculates total integration time ($T_{\text{total}}$) to achieve target Signal-to-Noise Ratios:
$$T_{\text{total}} = \left(\frac{\text{SNR} \cdot N_{\text{total}}}{S}\right)^2$$
* T1: **First Glance** ($\text{SNR} = 3.0$)
* T2: **Decent Picture** ($\text{SNR} = 12.0$)
* T3: **Deep Clean** ($\text{SNR} = 25.0$)

---

## 📦 Project Setup

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Run Locally
Start the Vite development server:
```bash
npm run dev
```

### Build for Production
Generate the production-ready build:
```bash
npm run build
```

---

## 📁 Repository Structure
* `/src/main.js` - Core logic, coordinate horizontal projection math, SIMBAD API queries, twilight scan algorithm, and DOM controllers.
* `/src/style.css` - Custom mobile-first responsive styles, glassmorphic layout, and monochrome night mode.
* `/src/data/dso_catalog.json` - Rebuilt DSO catalog database containing 1,846 objects.
* `/index.html` - Primary HTML template.
* `/scripts/generate_catalog.py` - Python script to compile/query SIMBAD TAP with curated overrides.
* `checkpoint.md` - Technical checkpoints and accomplishments summary.
* `walkthrough.md` - Technical walkthrough and details on math/API/mobile redesigns.
