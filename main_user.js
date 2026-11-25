// ==UserScript==
// @name         Geo-ports
// @namespace    geo-ports
// @version      1.1.0
// @description  Geo-ports: adds custom airport buildings (currently Delhi, VIDP) to GeoFS. Models load only when you are nearby.
// @author       (add your name / credits here)
// @match        *://geo-fs.com/*
// @match        *://*.geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/* Once this script lives in your own GitHub repo, add these two lines to the block above
   so Tampermonkey can auto-update it (replace USER/REPO):
   // @updateURL    https://raw.githubusercontent.com/USER/REPO/main/geo-ports.user.js
   // @downloadURL  https://raw.githubusercontent.com/USER/REPO/main/geo-ports.user.js */

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
                   Use ~15000 for small buildings and ~40000 for big terminals visible from far away.
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
        }
    ];

    /* ================= LOGIC ================= */
    let viewer = null;
    const state = MODELS.map(m => ({
        cfg: m,
        entity: null,
        pos: null,
        enabled: !/YOUR-USER|YOUR-REPO/.test(m.url)
    }));

    const waiter = setInterval(() => {
        const v = window.geofs && geofs.api && geofs.api.viewer;
        if (v && typeof Cesium !== "undefined") {
            clearInterval(waiter);
            viewer = v;
            setTimeout(start, 2000);
        }
    }, 1000);

    function start() {
        state.forEach(s => {
            s.pos = Cesium.Cartesian3.fromDegrees(s.cfg.lon, s.cfg.lat, s.cfg.alt);
            if (!s.enabled) console.warn(LOG, s.cfg.name + " skipped: its url still has the YOUR-USER/YOUR-REPO placeholder");
        });
        console.log(LOG, "ready, " + state.filter(s => s.enabled).length + " model(s) registered");
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
            state.forEach(s => {
                if (!s.enabled) return;
                const radius = s.cfg.loadRadius || 30000;
                const d = Cesium.Cartesian3.distance(cam, s.pos);
                if (s.entity && d > radius * UNLOAD_FACTOR) removeModel(s);
                else if (!s.entity && d < radius) wanted.push({ s: s, d: d });
            });
            // load the nearest ones first, a few per check
            wanted.sort((a, b) => a.d - b.d);
            wanted.slice(0, MAX_LOADS_PER_CHECK).forEach(w => addModel(w.s));
        } catch (err) {
            console.warn(LOG, "update failed", err);
        }
    }
})();
