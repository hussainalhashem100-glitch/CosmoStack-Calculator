# Checkpoint - CosmoStack Exposure Calculator

CosmoStack is a client-side Single Page Application (SPA) designed to calculate required stacking times to reach three quality tiers for deep-sky objects, using the Seestar S30 Pro as the baseline profile.

---

## Major Accomplishments

### 1. Mobile-First Redesign & Phone Screen Optimization
- **iPhone 15 Layout Optimization:** Reworked stylesheet spacing and padding media queries in [src/style.css](file:///c:/Users/hussa/Desktop/Seestar/src/style.css) to eliminate horizontal table overflows and desktop scaling bugs on mobile devices (< 600px).
- **Live Telemetry Preservation:** Overrode vertical stacking rules to keep Live Sensor Telemetry indicators side-by-side using compact sizes, saving critical vertical spacing.
- **Table-to-Cards Transformation:** Replaced the wide table in "Tonight's Best Targets" on mobile screens with a responsive list of modern cards. Card elements align keys to the left and values to the right in a clean grid layout.
- **Scotopic Compatibility:** Tested and confirmed that all new card layouts and border highlights adapt perfectly to Night Mode (monochrome red colors).

### 2. Expanded Local Catalog to 1,846 Targets
- **Added Curated Nebulae:** Modified [scripts/generate_catalog.py](file:///c:/Users/hussa/Desktop/Seestar/scripts/generate_catalog.py) to incorporate 41 iconic nebulae (e.g. North America, Pelican, Heart, Soul, Sadr Region, and Elephant's Trunk). These diffuse emission nebulae lack standard V-band fluxes in SIMBAD and were previously excluded.
- **Compiled Dataset:** Rebuilt [dso_catalog.json](file:///c:/Users/hussa/Desktop/Seestar/src/data/dso_catalog.json) to expand the catalog size to **1,846 targets**.

### 3. Advanced Planning Parameters & Custom Sorting
- **Date & 24h Time Inputs:** Replaced simple relative offsets with a native Calendar Date input and a 24-hour time selector in [index.html](file:///c:/Users/hussa/Desktop/Seestar/index.html).
- **Altitude-Based Sorting:** Projections in [src/main.js](file:///c:/Users/hussa/Desktop/Seestar/src/main.js) calculate object coordinates at the exact chosen start time and sort the suggestions from highest altitude to lowest altitude at that moment.
- **Wrap-Around Azimuth Filters:** Implemented a full-circle azimuth check supporting wrapped bounds (e.g. `340°` to `30°` correctly spans North).
- **Compass Sector Widget:** Added a 3x3 interactive button grid (N, NE, E, SE, S, SW, W, NW, All) for quick one-click azimuth preset configuration.
- **Trend Indicators:** Displays whether each target is rising, falling, or stable at the chosen start time.

### 4. Astronomical Night & Twilight Warning System (Isha/Fajr Prayers)
- **Sun Altitude Scanning Engine:** Scans a 24-hour period of the night (from local noon to local noon of the next day, wrapping to yesterday if the chosen hour is `< 12`) in 5-minute increments.
- **Boundary Detection:** Calculates the exact local times when the Sun sinks below $-18^\circ$ (Isha) and rises back above $-18^\circ$ (Fajr) using linear interpolation.
- **Warning Banners:** Renders a dynamic status banner:
  - **Green Banner:** If observing within the perfect window between Isha and Fajr.
  - **Yellow Banner:** If observing during twilight (Astronomical, Nautical, Civil) before Isha or after Fajr, or if the latitude has no Astronomical Night on that date.
  - **Red Banner:** If observing during daytime.
- **Local Time Conversion:** Formats twilight times into the local 24-hour time of the observer's timezone offset.

### 5. Automated Build & Live Netlify Deploy
- Verified clean compilation using Vite.
- Deployed the updated assets to Netlify. The site is live at **https://cosmostack-calculator.netlify.app**.
- Staged all local git modifications cleanly. Commits and remote pushes will remain on hold until the user verifies the site on their iPhone 15 and gives explicit approval.
