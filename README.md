# CosmoStack Exposure & Stacking Calculator

CosmoStack is a client-side Single Page Application (SPA) designed to calculate required stacking times to reach three quality integration tiers for deep-sky objects (DSOs) using smart telescopes, with the **Seestar S30 Pro** as the baseline hardware profile.

## 🚀 Live Site
The application is live and hosted on Netlify: **[https://cosmostack-calculator.netlify.app](https://cosmostack-calculator.netlify.app)**

---

## ✨ Features

1. **Tonight's Best Targets Panel**:
   * **20-Minute Scan Resolution**: Scans a 24-hour window centered on the current hour (from 12 hours in the past to 12 hours in the future) in 20-minute intervals (73 slots total).
   * **Curated Target Filter ("Nice/Beautiful Stuff")**: Filters the search pool down to a curated list of **477 premium targets** (all 110 Messier objects, 40 named objects, and bright DSOs with magnitude $m < 11.5$). Filters out obscure, ultra-faint gray smudges.
   * **Zenith Transit Selection**: For each slot, it finds the target closest to 90 degrees (highest altitude) at that specific time step.
   * **De-duplication**: Group by DSO name and keep the occurrence closest to 90 degrees (highest altitude), preventing the same DSO from repeating in adjacent rows.
   * **Proximity Sorting**: Sorted by proximity to the current moment (`Now` first, followed by `in 20m` / `20m ago`, `in 40m` / `40m ago`, up to `12h` offset) with relative time countdowns.

2. **SCOTOPIC Night Vision Mode**:
   * A monochrome, deep-red theme overlay to preserve observers' dark-adapted vision during field usage.

3. **Live Sensor Telemetry badge**:
   * Shows real-time estimated object signal ($S$) vs sky background rate ($B_{\text{sky}}$) in $e^{-}/\text{pixel}/\text{sec}$. Shows stacking badges like `Sky-Noise Dominated` or `Signal Dominated`.

4. **Dynamic SIMBAD TAP Fallback**:
   * Integrates an async query client directly to the professional Strasbourg astronomical database (CDS SIMBAD TAP API). If an object is not in the local database, it capitalizes and searches `ident.id` on-the-fly and calculates surface brightness.

5. **Linear Visual Perception Stacking Model**:
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
* `/src/main.js` - Core logic, coordinate horizontal projection math, SIMBAD API queries, and DOM controllers.
* `/src/style.css` - Custom styles, layout variables, and monochrome night mode.
* `/src/data/dso_catalog.json` - Rebuilt DSO catalog database containing 1,811 objects.
* `/index.html` - Primary HTML template.
* `/scripts/generate_catalog.py` - Python script to compile/query SIMBAD TAP.
* `checkpoint.md` - Technical checkpoints and accomplishments summary.
