// ==UserScript==
// @name         Geo-ports
// @namespace    geo-ports
// @version      1.5.0
// @description  Geo-ports: adds custom airport buildings (Delhi, Bengaluru, Tokyo, Hong Kong, Shanghai) to GeoFS. Models load only when you are nearby.
// @author       The-Maharaja
// @match        *://geo-fs.com/*
// @match        *://*.geo-fs.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/The-Maharaja/Geo-Ports/main/geo-ports.user.js
// @downloadURL  https://raw.githubusercontent.com/The-Maharaja/Geo-Ports/main/geo-ports.user.js
// ==/UserScript==

(function () {
    "use strict";

    const LOG = "[Geo-ports]";

    /* ================= SETTINGS ================= */
    const CHECK_EVERY_MS = 2000;   // how often distances are checked
    const MAX_LOADS_PER_CHECK = 1; // stream models in one at a time so a busy airport never loads everything at once
    const UNLOAD_FACTOR = 1.2;     // a model is removed at loadRadius * this (avoids flicker at the edge)

    /* ================= MODELS =================
       Paste configs copied from the Geo-ports Dev Tool here (one object per model).
       loadRadius: metres from the camera within which this model is loaded.
       hideTiles:  optional list of GeoFS building-tile names (e.g. "10_1672_385") that are not loaded, which hides
                   EVERY default building inside those tiles. Only for places where a custom model replaces them.
       mode: "absolute" (default), "relative", or "clamp". */
    const MODELS = [
        {
            name: "Delhi ATC Tower",
            url: "https://cdn.jsdelivr.net/gh/The-Maharaja/Geofs-Delhi-ATC@main/Delhi%20ATC.glb",
            lat: 28.556167,
            lon: 77.092494,
            alt: 237.0,
            heading: 90.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },

        /* ---- Bengaluru (VOBL) ---- */
        {
            name: "BLR ATC Tower",
            url: "https://cdn.jsdelivr.net/gh/greenairways/test@latest/speedbirdfiles/ATC%20tower.glb",
            lat: 13.198876,
            lon: 77.705320,
            alt: 894.90,
            heading: 90.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR Cargo Building (DHL, FedEx, UPS)",
            url: "https://cdn.jsdelivr.net/gh/greenairways/test@latest/speedbirdfiles/DHL%20+%20FedEx%20+%20UPS%20building.glb",
            lat: 13.200860,
            lon: 77.695280,
            alt: 895.54,
            heading: 0.0,
            scale: 1.02,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR Shell Gas Station",
            url: "https://cdn.jsdelivr.net/gh/greenairways/test@latest/speedbirdfiles/Shell%20gas%20station.glb",
            lat: 13.199997,
            lon: 77.690975,
            alt: 896.06,
            heading: 180.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR IndiGo MRO",
            url: "https://cdn.jsdelivr.net/gh/greenairways/test@latest/speedbirdfiles/IndiGo%20MRO%20VOBL.glb",
            lat: 13.200824,
            lon: 77.686726,
            alt: 909.40,
            heading: 90.0,
            scale: 1.02,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR Blue Dart Express Terminal 2",
            url: "https://cdn.jsdelivr.net/gh/greenairways/test@latest/speedbirdfiles/BLUE%20DART%20EXPRESS%20TERMINAL%202%20(TWO).glb",
            lat: 13.200524,
            lon: 77.694243,
            alt: 905.60,
            heading: 180.9,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR Arch and Plane-spotting Tower",
            url: "https://cdn.jsdelivr.net/gh/SpeedBird4284/GeoFS-3D-buildings@main/BIAL Arch + Plane spotting TWR.glb",
            lat: 13.210457,
            lon: 77.719766,
            alt: 895.60,
            heading: 115.5,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "BLR Water Tank and Plane Spotter",
            url: "https://cdn.jsdelivr.net/gh/SpeedBird4284/GeoFS-3D-buildings@main/Water tank + Plane spotter.glb",
            lat: 13.210214,
            lon: 77.719833,
            alt: 895.60,
            heading: 115.5,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },

        /* ---- Hong Kong (VHHH) ---- */
        {
            name: "VHHH Hong Kong Terminal 1",
            // Optimised copy of rdpsitw's VHHH model: same geometry, much smaller file and textures.
            url: "https://cdn.jsdelivr.net/gh/The-Maharaja/Geo-Ports@main/VHHH_optimized.glb",
            lat: 22.313954,
            lon: 113.930337,
            alt: 3.55,
            heading: 0.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000,
            // The tile that holds the old default airport buildings (the same tile greenairways' old OSM addon blocked).
            hideTiles: ["10_1672_385"]
        },

        /* ---- Tokyo Haneda (RJTT) ---- */
        {
            name: "RJTT Haneda Terminal 1",
            url: "https://cdn.jsdelivr.net/gh/rdpsitw/rjtt-t1@main/RJTTforexport.glb",
            lat: 35.548851,
            lon: 139.784042,
            alt: -2.36,
            heading: 0.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 25000
        },
        {
            name: "RJTT Haneda Tower",
            url: "https://cdn.jsdelivr.net/gh/rdpsitw/rjtt-t1@main/RJTTtower3.glb",
            lat: 35.551730,
            lon: 139.783958,
            alt: -2.36,
            heading: 0.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 25000
        },

        /* ---- Shanghai Pudong (ZSPD) ---- */
        {
            name: "ZSPD Shanghai Pudong Terminal 1",
            url: "https://cdn.jsdelivr.net/gh/rdpsitw/zspd-t1@main/Untitled1.glb",
            lat: 31.151350,
            lon: 121.797810,
            alt: 3.7,
            heading: 0.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        },
        {
            name: "ZSPD Shanghai Pudong Tower",
            url: "https://cdn.jsdelivr.net/gh/rdpsitw/zspd-t1@main/tower.glb",
            lat: 31.143736,
            lon: 121.802243,
            alt: 3.5,
            heading: 0.0,
            scale: 1.0,
            mode: "absolute",
            loadRadius: 20000
        }
    ];

    /* ================= DEFAULT-BUILDING REMOVER =================
       GeoFS loads its default buildings as map-tile files named {zoom}_{x}_{y}.glb. Tiles listed in a model's
       `hideTiles` are not loaded, which hides every default building inside them. This runs at document-start so it
       is in place before GeoFS asks for any tile.
       To see which building tiles GeoFS requests (and which are blocked), run this once in the browser console and
       reload GeoFS:   localStorage.setItem("geoports-debug-tiles", "1")
       To turn it off:  localStorage.removeItem("geoports-debug-tiles") */
    const DEBUG_TILES = (function () {
        try { return localStorage.getItem("geoports-debug-tiles") === "1"; } catch (e) { return false; }
    })();
    const TILE_RE = /\/buildings\/(\d+)_(\d+)_(\d+)\.glb/;
    const blockedTiles = new Set();
    MODELS.forEach(function (m) {
        (m.hideTiles || []).forEach(function (t) { blockedTiles.add(t); });
    });

    function urlOf(input) {
        try {
            if (typeof input === "string") return input;
            if (input && typeof input.url === "string") return input.url;   // Request object
            if (input && typeof input.href === "string") return input.href; // URL object
            return String(input);
        } catch (e) { return ""; }
    }

    function isBlocked(url) {
        const m = TILE_RE.exec(url);
        if (!m || /jsdelivr/.test(url)) return false;
        const key = m[1] + "_" + m[2] + "_" + m[3];
        const blocked = blockedTiles.has(key);
        if (DEBUG_TILES) console.log(LOG, "building tile " + key + (blocked ? " BLOCKED" : " allowed"));
        return blocked;
    }

    if (blockedTiles.size > 0 || DEBUG_TILES) {
        const origFetch = window.fetch;
        if (typeof origFetch === "function") {
            window.fetch = function (input) {
                if (isBlocked(urlOf(input))) {
                    return Promise.reject(new TypeError("Request blocked by Geo-ports"));
                }
                return origFetch.apply(this, arguments);
            };
        }

        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__geoportsBlocked = isBlocked(urlOf(url));
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function () {
            if (this.__geoportsBlocked) {
                const xhr = this;
                setTimeout(function () {
                    xhr.dispatchEvent(new ProgressEvent("error"));
                    xhr.dispatchEvent(new ProgressEvent("loadend"));
                }, 0);
                return;
            }
            return origSend.apply(this, arguments);
        };
        console.log(LOG, "default-building remover active: " + blockedTiles.size + " tile(s) blocked");
    }

    /* ================= MODEL LOADER ================= */
    let viewer = null;
    const state = MODELS.map(function (m) { return { cfg: m, entity: null, pos: null }; });

    const waiter = setInterval(function () {
        const v = window.geofs && geofs.api && geofs.api.viewer;
        if (v && typeof Cesium !== "undefined") {
            clearInterval(waiter);
            viewer = v;
            setTimeout(start, 2000);
        }
    }, 1000);

    function start() {
        state.forEach(function (s) {
            s.pos = Cesium.Cartesian3.fromDegrees(s.cfg.lon, s.cfg.lat, s.cfg.alt);
        });
        console.log(LOG, "ready, " + state.length + " model(s) registered");
        update();
        setInterval(update, CHECK_EVERY_MS);
    }

    function heightRef(mode) {
        const H = Cesium.HeightReference;
        if (mode === "clamp") return H.CLAMP_TO_GROUND;
        if (mode === "relative") return H.RELATIVE_TO_GROUND;
        return H.NONE;
    }

    function toUri(url) {
        try { return encodeURI(decodeURI(url)); } catch (e) { return url; }
    }

    function addModel(s) {
        const c = s.cfg;
        s.entity = viewer.entities.add({
            name: c.name,
            position: s.pos,
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
                s.pos, new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(c.heading), 0, 0)),
            model: {
                uri: toUri(c.url),
                scale: c.scale,
                heightReference: heightRef(c.mode)
            }
        });
        console.log(LOG, "loaded " + c.name);
    }

    function removeModel(s) {
        viewer.entities.remove(s.entity);
        s.entity = null;
        console.log(LOG, "unloaded " + s.cfg.name);
    }

    function update() {
        try {
            const cam = viewer.camera.positionWC;
            const wanted = [];
            state.forEach(function (s) {
                const radius = s.cfg.loadRadius || 30000;
                const d = Cesium.Cartesian3.distance(cam, s.pos);
                if (s.entity && d > radius * UNLOAD_FACTOR) removeModel(s);
                else if (!s.entity && d < radius) wanted.push({ s: s, d: d });
            });
            // load the nearest ones first, a few per check
            wanted.sort(function (a, b) { return a.d - b.d; });
            wanted.slice(0, MAX_LOADS_PER_CHECK).forEach(function (w) { addModel(w.s); });
        } catch (err) {
            console.warn(LOG, "update failed", err);
        }
    }
})();
