import urllib.request
import urllib.parse
import json
import math
import os
import sys

# Output paths
os.makedirs("src/data", exist_ok=True)
os.makedirs("scripts", exist_ok=True)
OUTPUT_FILE = "src/data/dso_catalog.json"

# Common names mapping for Messier and famous NGC/IC objects
COMMON_NAMES = {
    "M 1": "Crab Nebula",
    "M 8": "Lagoon Nebula",
    "M 11": "Wild Duck Cluster",
    "M 13": "Hercules Globular Cluster",
    "M 16": "Eagle Nebula",
    "M 17": "Omega Nebula",
    "M 20": "Trifid Nebula",
    "M 22": "Sagittarius Cluster",
    "M 24": "Sagittarius Star Cloud",
    "M 27": "Dumbbell Nebula",
    "M 31": "Andromeda Galaxy",
    "M 32": "Le Gentil (Andromeda Satellite)",
    "M 33": "Triangulum Galaxy",
    "M 42": "Orion Nebula",
    "M 43": "De Mairan's Nebula",
    "M 44": "Beehive Cluster",
    "M 45": "Pleiades",
    "M 51": "Whirlpool Galaxy",
    "M 57": "Ring Nebula",
    "M 63": "Sunflower Galaxy",
    "M 64": "Black Eye Galaxy",
    "M 74": "Phantom Galaxy",
    "M 76": "Little Dumbbell Nebula",
    "M 78": "Orion Reflection Nebula",
    "M 81": "Bode's Galaxy",
    "M 82": "Cigar Galaxy",
    "M 83": "Southern Pinwheel Galaxy",
    "M 97": "Owl Nebula",
    "M 101": "Pinwheel Galaxy",
    "M 104": "Sombrero Galaxy",
    "M 110": "Edward Young's Nebula",
    "NGC 7000": "North America Nebula",
    "NGC 6960": "Western Veil Nebula",
    "NGC 6992": "Eastern Veil Nebula",
    "NGC 2237": "Rosette Nebula",
    "NGC 2244": "Rosette Cluster",
    "NGC 1499": "California Nebula",
    "NGC 281": "Pacman Nebula",
    "IC 434": "Horsehead Nebula",
    "NGC 2024": "Flame Nebula",
    "NGC 7635": "Bubble Nebula",
    "NGC 2359": "Thor's Helmet",
    "NGC 6888": "Crescent Nebula",
    "IC 1396": "Elephant's Trunk Nebula",
    "NGC 5139": "Omega Centauri",
    "NGC 104": "47 Tucanae",
    "NGC 4755": "Jewel Box Cluster",
    "NGC 3372": "Carina Nebula",
    "NGC 3576": "Statue of Liberty Nebula",
    "NGC 6334": "Cat's Paw Nebula",
    "NGC 6357": "Lobster Nebula",
    "IC 4604": "Rho Ophiuchi Nebula",
    "NGC 7293": "Helix Nebula",
    "NGC 6543": "Cat's Eye Nebula",
    "NGC 3242": "Ghost of Jupiter",
    "NGC 7009": "Saturn Nebula",
    "NGC 4565": "Needle Galaxy",
    "NGC 5907": "Splinter Galaxy",
    "NGC 891": "Outer Limits Galaxy",
    "NGC 4631": "Whale Galaxy",
    "NGC 4656": "Hockey Stick Galaxy",
    "NGC 253": "Sculptor Galaxy",
    "NGC 55": "Whale Galaxy (South)",
    "NGC 1365": "Great Barred Spiral Galaxy",
    "NGC 7331": "Deer Lick Group",
    "NGC 7317": "Stephan's Quintet",
    "NGC 4038": "Antennae Galaxies",
    "NGC 2403": "Camelopardalis Spiral",
    "NGC 2903": "Leo Barred Spiral",
    "NGC 4244": "Silver Needle Galaxy",
    "NGC 3628": "Sarah's Galaxy / Hamburger Galaxy",
    "NGC 3627": "M 66 (Leo Triplet)",
    "NGC 3623": "M 65 (Leo Triplet)"
}

# Hand-curated standard visual surface brightness overrides for Messier/NGC extended objects
# to represent their bright visual cores (preventing massive diffuse dimensions from distorting them)
SB_OVERRIDES = {
    "M 8": 20.50,      # Lagoon Nebula core
    "M 16": 21.50,     # Eagle Nebula core
    "M 17": 20.00,     # Omega Nebula core
    "M 20": 21.50,     # Trifid Nebula core
    "M 42": 19.50,     # Orion Nebula core
    "M 43": 21.00,     # De Mairan's Nebula
    "M 78": 21.00,     # Orion Reflection Nebula
    "NGC 7000": 21.50, # North America Nebula core
    "NGC 6960": 21.80, # Western Veil Nebula (bright parts)
    "NGC 6992": 21.50, # Eastern Veil Nebula
    "NGC 2237": 22.00, # Rosette Nebula core
    "NGC 1499": 22.00, # California Nebula core
    "IC 1396": 22.50,  # Elephant's Trunk Nebula
    "NGC 3372": 20.00, # Carina Nebula core
    "NGC 3576": 21.00, # Statue of Liberty core
    "NGC 6334": 21.50, # Cat's Paw Nebula
    "NGC 6357": 21.50, # Lobster Nebula
}

# Mapping SIMBAD otypes to cleaner, standard user-friendly types
TYPE_MAP = {
    "G": "Galaxy",
    "PN": "Planetary Nebula",
    "HII": "Emission Nebula",
    "RfN": "Reflection Nebula",
    "SNR": "Supernova Remnant",
    "Cl*": "Open Cluster",
    "OpC": "Open Cluster",
    "GlC": "Globular Cluster",
    "Neb": "Emission Nebula",
    "Assoc*": "Open Cluster"
}

def query_simbad_tap(adql_query):
    """Sends a synchronous query to SIMBAD TAP and returns the parsed JSON response."""
    url = "https://simbad.u-strasbg.fr/simbad/sim-tap/sync"
    params = {
        "request": "doQuery",
        "lang": "ADQL",
        "format": "json",
        "query": adql_query
    }
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "CosmoStackCalculator/1.0"})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error querying SIMBAD TAP: {e.code}", file=sys.stderr)
        try:
            print(e.read().decode("utf-8"), file=sys.stderr)
        except Exception:
            pass
        return {}
    except Exception as e:
        print(f"Error querying SIMBAD TAP: {e}", file=sys.stderr)
        return {}

def fetch_yale_messier():
    """Fetches a standard complete Messier catalog JSON file as a fallback."""
    url = "https://brettonw.github.io/YaleBrightStarCatalog/messier.json"
    req = urllib.request.Request(url, headers={"User-Agent": "CosmoStackCalculator/1.0"})
    try:
        print("Fetching Yale Messier catalog fallback...")
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching Yale Messier catalog: {e}", file=sys.stderr)
        return []

def parse_yale_type(t_code):
    t = t_code.upper()
    if t == "GC": return "Globular Cluster"
    if t == "OC": return "Open Cluster"
    if t == "DN": return "Emission Nebula"
    if t == "PN": return "Planetary Nebula"
    if t == "SN": return "Supernova Remnant"
    if t in ["G", "SG", "IG", "EG"]: return "Galaxy"
    if t == "MW": return "Open Cluster"
    return "Emission Nebula"

def parse_yale_dimensions(s_str):
    if not s_str:
        return {"maj": 2.0, "min": 2.0}
    try:
        if "x" in s_str:
            maj_str, min_str = s_str.split("x")
            return {"maj": float(maj_str), "min": float(min_str)}
        else:
            val = float(s_str)
            return {"maj": val, "min": val}
    except Exception:
        return {"maj": 2.0, "min": 2.0}

def parse_yale_coords(ra_str, dec_str):
    """Parses Yale catalog formatted coordinates e.g. RA '5h 34.5m', Dec '+22° 01′' to decimal degrees."""
    ra_deg = 0.0
    try:
        if ra_str:
            parts = ra_str.replace("h", "").replace("m", "").split()
            h = float(parts[0])
            m = float(parts[1]) if len(parts) > 1 else 0.0
            ra_deg = (h + m / 60.0) * 15.0
    except Exception:
        pass
        
    dec_deg = 0.0
    try:
        if dec_str:
            clean = dec_str.replace("°", "").replace("′", "").replace("'", "")
            sign = -1.0 if "-" in clean else 1.0
            clean = clean.replace("-", "").replace("+", "").strip()
            parts = clean.split()
            d = float(parts[0])
            m = float(parts[1]) if len(parts) > 1 else 0.0
            dec_deg = sign * (d + m / 60.0)
    except Exception:
        pass
    return ra_deg, dec_deg

def normalize_main_id(name):
    """Clean up SIMBAD's main_id spacing and strip 'NAME ' prefixes."""
    if not name:
        return ""
    name = name.replace("NAME ", "").strip()
    parts = name.split()
    return " ".join(parts)

def parse_simbad_results(results):
    """Parses raw SIMBAD JSON results into a dictionary grouped by object name."""
    if not results or "metadata" not in results or "data" not in results:
        return {}
    
    col_names = [col["name"] for col in results["metadata"]]
    idx_main_id = col_names.index("main_id")
    idx_otype = col_names.index("otype")
    idx_maj = col_names.index("galdim_majaxis")
    idx_min = col_names.index("galdim_minaxis")
    idx_flux = col_names.index("flux")
    idx_filter = col_names.index("filter")
    idx_ra = col_names.index("ra")
    idx_dec = col_names.index("dec")
    
    objects = {}
    for row in results["data"]:
        raw_id = row[idx_main_id]
        if not raw_id:
            continue
            
        main_id = normalize_main_id(raw_id)
        otype = row[idx_otype] or "Other"
        maj = row[idx_maj] # arcmin
        min_axis = row[idx_min] # arcmin
        flux = row[idx_flux] # magnitude
        filt = row[idx_filter]
        ra = row[idx_ra]
        dec = row[idx_dec]
        
        if main_id not in objects:
            objects[main_id] = {
                "name": main_id,
                "commonName": COMMON_NAMES.get(main_id, ""),
                "type": TYPE_MAP.get(otype, "Emission Nebula"),
                "mag": None,
                "maj": maj,
                "min": min_axis,
                "ra": ra,
                "dec": dec,
                "fluxes": {}
            }
            
        if flux is not None and filt:
            objects[main_id]["fluxes"][filt] = float(flux)
            
        if objects[main_id]["maj"] is None and maj is not None:
            objects[main_id]["maj"] = maj
        if objects[main_id]["min"] is None and min_axis is not None:
            objects[main_id]["min"] = min_axis
            
    final_list = []
    for main_id, obj in objects.items():
        fluxes = obj["fluxes"]
        mag = None
        for f_band in ["V", "G", "B", "R"]:
            if f_band in fluxes:
                mag = fluxes[f_band]
                break
        
        if mag is None and fluxes:
            mag = list(fluxes.values())[0]
            
        obj["mag"] = mag
        
        # Dimensions are already in arcminutes
        maj_val = obj["maj"]
        min_val = obj["min"]
        
        maj_arcmin = float(maj_val) if (maj_val is not None and maj_val > 0) else None
        min_arcmin = float(min_val) if (min_val is not None and min_val > 0) else None
        
        obj["dimensions"] = {
            "maj": round(maj_arcmin, 2) if maj_arcmin is not None else None,
            "min": round(min_arcmin, 2) if min_arcmin is not None else None
        }
        
        # We don't discard yet if mag is None, we will fill it from Yale if it's a Messier
        if mag is not None and maj_arcmin is not None and min_arcmin is not None:
            area_arcsec2 = math.pi * (maj_arcmin * min_arcmin / 4.0) * 3600.0
            if area_arcsec2 > 0:
                sb = mag + 2.5 * math.log10(area_arcsec2)
            else:
                sb = mag
            if main_id in SB_OVERRIDES:
                sb = SB_OVERRIDES[main_id]
            obj["sb"] = round(sb, 2)
        else:
            obj["sb"] = None
            
        # Round coordinates for storage
        obj["ra"] = round(obj["ra"], 6) if obj["ra"] is not None else None
        obj["dec"] = round(obj["dec"], 6) if obj["dec"] is not None else None
        
        del obj["fluxes"]
        del obj["maj"]
        del obj["min"]
        
        final_list.append(obj)
        
    return final_list

def main():
    print("Generating core database from SIMBAD TAP...")
    
    # 1. Fetch Yale Messier Catalog Fallback
    yale_data = fetch_yale_messier()
    yale_dict = {}
    for item in yale_data:
        m_num = item.get("M", "")
        if m_num:
            # Format as "M [number]"
            num = m_num[1:]
            m_formatted = f"M {num}"
            yale_dict[m_formatted] = item
            
    # 2. Fetch Messier Objects from SIMBAD
    print("Querying SIMBAD for Messier objects (M1 - M110)...")
    messier_names = [f"M {i}" for i in range(1, 111)]
    ids_str = ", ".join(f"'{n}'" for n in messier_names)
    
    messier_query = f"""
    SELECT DISTINCT main_id, otype, ra, dec, galdim_majaxis, galdim_minaxis, flux, filter
    FROM basic
    JOIN ident ON basic.oid = ident.oidref
    LEFT JOIN flux ON basic.oid = flux.oidref AND flux.filter IN ('V', 'B', 'G', 'R')
    WHERE ident.id IN ({ids_str})
    """
    
    m_raw = query_simbad_tap(messier_query)
    m_parsed = parse_simbad_results(m_raw)
    
    # Map SIMBAD results by name
    m_dict = {obj["name"]: obj for obj in m_parsed}
    
    # Populate/Merge Messier objects from Yale catalog to ensure 100% completeness
    final_messiers = []
    for i in range(1, 111):
        m_name = f"M {i}"
        simbad_obj = m_dict.get(m_name, None)
        yale_obj = yale_dict.get(m_name, None)
        
        if not simbad_obj and not yale_obj:
            continue
            
        # ALWAYS prefer Yale catalog visual magnitude for Messier objects to ensure integrated visual magnitude
        if yale_obj:
            try:
                mag = float(yale_obj.get("V", 8.0))
            except ValueError:
                mag = 8.0
                
            dims = parse_yale_dimensions(yale_obj.get("S", "2.0"))
            
            # Map common names, checking local map first, then Yale
            common = COMMON_NAMES.get(m_name, "")
            if not common:
                common = yale_obj.get("N", "")
                
            obj_type = parse_yale_type(yale_obj.get("T", "DN"))
            
            # Use SIMBAD type if available as it is more precise
            if simbad_obj and simbad_obj.get("type"):
                obj_type = simbad_obj["type"]
                
            # If SIMBAD has good dimensions, prefer SIMBAD's physical dimensions
            if simbad_obj and simbad_obj["dimensions"]["maj"] is not None:
                maj_arcmin = simbad_obj["dimensions"]["maj"]
                min_arcmin = simbad_obj["dimensions"]["min"] if simbad_obj["dimensions"]["min"] is not None else maj_arcmin
            else:
                maj_arcmin = dims["maj"]
                min_arcmin = dims["min"]
            
            area_arcsec2 = math.pi * (maj_arcmin * min_arcmin / 4.0) * 3600.0
            sb = mag + 2.5 * math.log10(area_arcsec2) if area_arcsec2 > 0 else mag
            if m_name in SB_OVERRIDES:
                sb = SB_OVERRIDES[m_name]
            
            # Extract RA/Dec from SIMBAD or fallback to Yale
            ra_val = simbad_obj["ra"] if (simbad_obj and simbad_obj.get("ra") is not None) else None
            dec_val = simbad_obj["dec"] if (simbad_obj and simbad_obj.get("dec") is not None) else None
            
            if ra_val is None or dec_val is None:
                ra_val, dec_val = parse_yale_coords(yale_obj.get("RA"), yale_obj.get("Dec"))
                
            merged_obj = {
                "name": m_name,
                "commonName": common,
                "type": obj_type,
                "mag": mag,
                "dimensions": {
                    "maj": round(maj_arcmin, 2),
                    "min": round(min_arcmin, 2)
                },
                "sb": round(sb, 2),
                "ra": round(ra_val, 6) if ra_val is not None else None,
                "dec": round(dec_val, 6) if dec_val is not None else None
            }
            final_messiers.append(merged_obj)
        elif simbad_obj:
            # We only have SIMBAD
            if simbad_obj["mag"] is None:
                simbad_obj["mag"] = 8.0
            if simbad_obj["sb"] is None:
                area = math.pi * (simbad_obj["dimensions"]["maj"] * simbad_obj["dimensions"]["min"] / 4.0) * 3600.0
                simbad_obj["sb"] = simbad_obj["mag"] + 2.5 * math.log10(area) if area > 0 else simbad_obj["mag"]
            final_messiers.append(simbad_obj)
            
    print(f"Messier completeness check: compiled {len(final_messiers)}/110 targets.")
    
    # 3. Fetch Brightest 2000 NGC/IC Objects using cross-identifiers join
    print("Querying SIMBAD for brightest NGC/IC objects (joining cross-identifiers)...")
    ngc_query = """
    SELECT DISTINCT main_id, otype, ra, dec, galdim_majaxis, galdim_minaxis, flux, filter
    FROM basic
    JOIN ident ON basic.oid = ident.oidref
    JOIN flux ON basic.oid = flux.oidref
    WHERE (ident.id LIKE 'NGC %' OR ident.id LIKE 'IC %')
      AND basic.otype IN ('G', 'PN', 'HII', 'RfN', 'SNR', 'Cl*', 'OpC', 'GlC', 'Neb', 'Assoc*')
      AND flux.filter IN ('V', 'B', 'G', 'R')
      AND flux.flux IS NOT NULL
      AND flux.flux < 16.5
    ORDER BY flux ASC
    """
    
    ngc_raw = query_simbad_tap(ngc_query)
    ngc_parsed = parse_simbad_results(ngc_raw)
    
    # Sort NGC/IC by magnitude and take the brightest 2000 that are not already in Messier
    messier_names_set = {f"M {i}" for i in range(1, 111)}
    ngc_filtered = []
    for obj in sorted(ngc_parsed, key=lambda x: x["mag"]):
        if obj["name"] not in messier_names_set and obj["mag"] is not None:
            ngc_filtered.append(obj)
        if len(ngc_filtered) >= 2000:
            break
            
    print(f"Successfully resolved {len(ngc_filtered)} unique popular NGC/IC objects.")
    
    # Combine lists
    combined_catalog = final_messiers + ngc_filtered
    print(f"Combined database size: {len(combined_catalog)} objects.")
    
    # Sort combined catalog alphabetically/numerically
    def sort_key(obj):
        name = obj["name"]
        parts = name.split()
        if len(parts) >= 2:
            catalog = parts[0]
            num_str = parts[1]
            digits = ""
            for char in num_str:
                if char.isdigit():
                    digits += char
                else:
                    break
            num = int(digits) if digits else 0
            return (catalog, num, num_str)
        return (name, 0, "")
        
    combined_catalog.sort(key=sort_key)
    
    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(combined_catalog, f, indent=2, ensure_ascii=False)
        
    print(f"Database successfully written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
