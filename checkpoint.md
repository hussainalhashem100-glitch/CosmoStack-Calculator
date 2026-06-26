# Checkpoint - CosmoStack Exposure Calculator

CosmoStack is a client-side Single Page Application (SPA) designed to calculate required stacking times to reach three quality tiers for deep-sky objects, using the Seestar S30 Pro as the baseline profile.

## Major Accomplishments

### 1. Expanded Local Catalog to 1,811 Targets (Fixed Coordinates & Large Size)
- **Rebuilt Catalog Generator:** Upgraded `scripts/generate_catalog.py` to join `basic`, `ident`, and `flux` tables on SIMBAD TAP.
- **Improved Cross-Identifications:** Matching via the `ident` table allowed us to resolve NGC/IC catalog items that are not primary identifiers in SIMBAD, successfully expanding the catalog from 544 to **1,811 deep sky objects** (110 Messier + 1,701 brightest NGC/IC objects with magnitude < 16.5).
- **Added Coordinate Tracking:** Fetched and stored decimal Right Ascension (RA) and Declination (Dec) values for all 1,811 objects to enable real-time local sky coordinate calculations.
- **Cleaned Target Names:** Stripped `NAME ` prefixes from SIMBAD identifiers (e.g. `NAME SMC` -> `SMC`, `NAME LMC` -> `LMC`) to clean up display text.

### 2. Built "Tonight's Best Targets" Recommendation Engine
- **Horizontal Projection Math:** Implemented client-side astronomical math (Julian Date, GMST, LST, and Hour Angle) in [src/main.js](file:///c:/Users/hussa/Desktop/Seestar/src/main.js) to compute Alt/Az coordinates for all 1,811 cataloged objects in real-time.
- **20-Minute Resolution Scan:** Scans a 24-hour window centered on the current hour (from 12 hours in the past to 12 hours in the future) in 20-minute steps (73 total slots, from slot -36 to +36).
- **Curated Target Filter ("Nice/Beautiful Stuff"):** Filters the search pool down to a curated list of **477 premium targets** (110 Messier objects, 40 named objects, and bright DSOs with magnitude $m < 11.5$). This filters out obscure, ultra-faint gray smudges and focuses on recognizable, high-contrast objects for imaging.
- **Target Selection, De-duplication & Proximity Sorting:** For each of the 73 slots, it selects the target closest to 90 degrees altitude (highest altitude) at that specific time step. If a target is selected for multiple slots, it **de-duplicates them**, keeping only the single slot where the target's altitude is highest (closest to 90°). The final unique target list is then sorted from closest time offset to now to farthest (`Now` first, followed by `in 20m` / `20m ago`, `in 40m` / `40m ago`, up to `12h` offset).
- **Location Customization (Default Amman):** Defaults observation site to Amman, Jordan, but supports presets (London, New York, Tokyo, Sydney, Cairo), manual coordinates, and browser GPS auto-fill via a **"Use GPS"** button.
- **Cutoffs and Filtering:** Integrated check-filters for target types (Galaxies, Nebulae, Clusters) and a horizon altitude cutoff slider (default 15°).
- **Table Scroll UX & Target Selection:** Added a maximum height of `550px` and vertical scrolling (`overflow-y: auto`) to the table container in [src/style.css](file:///c:/Users/hussa/Desktop/Seestar/src/style.css) to display the 73 slots cleanly. Clicking "Select" loads the target and scrolls to the top.

### 3. Formulated Physics-Based Math Engine with Linear Model
- Built a precise mathematical engine in `src/main.js` which:
  - Computes Airmass $X = 1 / \sin(\theta)$ from target altitude $\theta$.
  - Adjusts object signal for atmospheric extinction $10^{-0.4 \times 0.2 \times X}$.
  - Computes sky background rate from SQM and Airmass $B_{\text{sky}} = B_{\text{sky}, 0} \times X$.
  - Applies dual-band filter modifiers (90% sky reduction, 80% object transmission for H-alpha/OIII in Nebulae).
  - **Applied Linear Stacking Model:** Added a linear visual perception compression factor ($\gamma = 0.63$) on surface brightness ($S_{b,\text{eff}} = 18.0 + (S_b - 18.0) \times 0.63$) to realistically scale stacking times for bright and faint DSOs (Orion Nebula Tier 3: 43.9m, Dumbbell Nebula Tier 3: 1.34h, Lagoon Nebula Tier 3: 1.86h, Andromeda Galaxy Tier 3: 39.46h).
  - **Bortle 8 Defaults Installed:** Set the default sky background level to Bortle 8 (SQM 18.00) in both the HTML dropdown and JS app state to match urban imaging environments.
  - Uses the total noise equation per sub-exposure (read noise, dark current, and signals) to solve for required total integration time:
    $$T_{\text{total}} = \left(\frac{SNR \cdot N_{\text{total}}}{S}\right)^2$$

### 4. Dynamic API Fallback & Missing Flux Resolution
- Implemented a fallback client-side query to the public **CDS SIMBAD TAP** service in `src/main.js` to dynamically resolve objects not found in our local database.
- Normalized user searches (e.g. `NGC7000` -> `NGC 7000`) to increase search hit rates and calculate surface brightness on-the-fly, applying the same hand-curated core overrides.
- **Fixed API 400 Error:** Resolved an issue where SIMBAD TAP queries failed with HTTP 400 Bad Request due to the unsupported ADQL `LOWER()` function. The application now generates capitalization and spacing combinations in JavaScript to perform a standard, indexed `IN ('term1', 'term2', ...)` exact-match query on SIMBAD's `ident.id`.
- **Added Coordinate Tracking:** Fallback queries now fetch decimal `ra` and `dec` directly from SIMBAD for accurate horizontal sky projections.
- **Implemented Magnitude/Flux Fallback (Teddy Bear Nebula Fix):** Extended nebulae (such as NGC 7822, Sh2-171, and IC 410) often have no integrated magnitude/flux recorded in SIMBAD's database. Previously, the calculator rejected these targets as "not found." We added an intelligent parsing fallback: if the magnitude is null, the app estimates surface brightness based on the object type (e.g. 21.5 mag/arcsec² for nebulae, 22.4 for galaxies, 20.0 for clusters) and uses it to calculate a realistic magnitude, marking the source as `SIMBAD (Est. Mag)` in the UI.

### 5. High-Fidelity Front-End UI
- Created `index.html` structure and `src/style.css` stylesheet providing:
  - Responsive two-column layout on desktop, single-column on mobile, and a full-width bottom recommendations dashboard.
  - "Deep Space" visual aesthetics (slate glassmorphism cards, glowing status text, and customized range sliders).
  - **Scotopic Night Vision Mode:** A monochrome deep-red toggle style to preserve scotopic vision in the field.
  - Interactive details collapsible hardware specs profile.
  - Telemetry badges summarizing object signal vs sky background.

### 6. Production Compilation Verified
- Verified that all modules compile cleanly using Vite.
- Tested the production build (`npm run build`) which generates optimized static assets ready for immediate deployment on Netlify under the `dist/` directory.

