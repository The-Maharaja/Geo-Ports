// ==UserScript==
// @name         Geo-ports Dev Tool
// @namespace    geo-ports-dev-tool
// @version      1.0.0
// @description  Geo-ports developer tool: loads ONE .glb (hosted URL or local file), tune position/heading/scale live, copy the config for the public addon.
// @match        *://geo-fs.com/*
// @match        *://*.geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    const LOG = "[Geo-ports Dev Tool]";

    /* ================= STARTING MODEL (one at a time) =================
       Change this, or type a new URL / pick a local .glb in the panel.
       mode: "absolute" (alt = height above ellipsoid), "relative" (metres above terrain), "clamp" (sit on terrain) */
    const MODEL = {
        name: "Delhi ATC Tower",
        url: "https://cdn.jsdelivr.net/gh/The-Maharaja/Geofs-Delhi-ATC@main/Delhi%20ATC.glb",
        lat: 28.556167,
        lon: 77.092494,
        alt: 237.0,
        heading: 90,
        scale: 1,
        mode: "absolute"
    };

    /* ================= STATE ================= */
    const cfg = Object.assign({}, MODEL);
    const home = Object.assign({}, MODEL); // slider ranges are centred on this
    let viewer = null;
    let entity = null;
    let objectUrl = null; // blob URL of a locally picked file

    const waiter = setInterval(() => {
        const v = window.geofs && geofs.api && geofs.api.viewer;
        if (v && typeof Cesium !== "undefined") {
            clearInterval(waiter);
            viewer = v;
            setTimeout(start, 2000);
        }
    }, 1000);

    function start() {
        console.log(LOG, "GeoFS ready");
        loadEntity(toUri(cfg.url));
        buildGUI();
    }

    /* ================= MODEL ================= */
    function toUri(url) {
        try { return encodeURI(decodeURI(url.trim())); } catch (e) { return url.trim(); }
    }

    function heightRef(mode) {
        const H = Cesium.HeightReference;
        if (mode === "clamp") return H.CLAMP_TO_GROUND;
        if (mode === "relative") return H.RELATIVE_TO_GROUND;
        return H.NONE;
    }

    function loadEntity(uri) {
        if (entity) viewer.entities.remove(entity);
        entity = viewer.entities.add({ name: cfg.name, model: { uri: uri } });
        applyModel();
        console.log(LOG, "Loaded", cfg.name, uri);
    }

    function applyModel() {
        if (!entity) return;
        const pos = Cesium.Cartesian3.fromDegrees(cfg.lon, cfg.lat, cfg.alt);
        entity.position = new Cesium.ConstantPositionProperty(pos);
        entity.orientation = new Cesium.ConstantProperty(
            Cesium.Transforms.headingPitchRollQuaternion(
                pos, new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(cfg.heading), 0, 0))
        );
        entity.model.scale = cfg.scale;
        entity.model.heightReference = heightRef(cfg.mode);
    }

    /* ================= GUI ================= */
    const FIELDS = [
        { key: "lat",     label: "Latitude",     span: 0.02, step: 0.00001, dec: 6 },
        { key: "lon",     label: "Longitude",    span: 0.02, step: 0.00001, dec: 6 },
        { key: "alt",     label: "Altitude (m)", span: 100,  step: 0.01,    dec: 2, min: -5 },
        { key: "heading", label: "Heading (°)",  min: 0, max: 360, step: 0.1, dec: 1 },
        { key: "scale",   label: "Scale (x)",    min: 0.1, max: 5,  step: 0.001, dec: 3 }
    ];
    const controls = [];
    let outputBox, nameInput, urlInput, modeSelect, panel;

    function el(tag, props, children) {
        const node = document.createElement(tag);
        Object.assign(node, props || {});
        (children || []).forEach(ch => node.appendChild(ch));
        return node;
    }

    function rangeFor(f) {
        if (f.span !== undefined) {
            const min = f.min !== undefined ? Math.max(f.min, home[f.key] - f.span) : home[f.key] - f.span;
            return { min: min, max: home[f.key] + f.span };
        }
        return { min: f.min, max: f.max };
    }

    function buildGUI() {
        document.head.appendChild(el("style", {
            textContent: `
            #gdt-panel{position:fixed;top:60px;right:10px;width:340px;max-height:85vh;overflow-y:auto;padding:12px;background:rgba(0,0,0,.88);
                color:#fff;font:13px Arial,sans-serif;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.5);z-index:999999;display:none}
            #gdt-panel .h{cursor:move;font-weight:bold;padding-bottom:6px;margin-bottom:8px;border-bottom:1px solid #444}
            #gdt-panel .r{margin-bottom:8px}
            #gdt-panel .l{display:flex;gap:6px;align-items:center}
            #gdt-panel input[type=range]{flex:1;min-width:0}
            #gdt-panel input[type=number]{width:105px;background:#222;color:#fff;border:1px solid #555;border-radius:3px;padding:2px 4px}
            #gdt-panel input[type=text],#gdt-panel select{width:100%;box-sizing:border-box;background:#222;color:#fff;border:1px solid #555;border-radius:3px;padding:3px}
            #gdt-panel textarea{width:100%;height:140px;box-sizing:border-box;background:#222;color:#ccf;border:none;padding:5px;font-size:11px}
            #gdt-panel button{width:100%;margin-top:5px;background:#007bff;color:#fff;border:none;padding:6px;border-radius:3px;cursor:pointer}
            #gdt-panel button.alt{background:#555}
            #gdt-toggle{position:fixed;top:10px;right:10px;z-index:999999;cursor:pointer;padding:3px 10px;line-height:25px;
                background:rgba(50,50,50,.85);color:#fff;border-radius:12px;font:bold 13px Arial,sans-serif;user-select:none}
            `
        }));

        panel = el("div", { id: "gdt-panel" });
        const head = el("div", { className: "h", textContent: "Geo-ports Dev Tool (one model)" });
        panel.appendChild(head);

        // Name + URL + load
        nameInput = el("input", { type: "text", value: cfg.name });
        nameInput.addEventListener("input", () => { cfg.name = nameInput.value; refreshOutput(); });
        urlInput = el("input", { type: "text", value: cfg.url });
        urlInput.addEventListener("input", () => { cfg.url = urlInput.value; refreshOutput(); });
        const loadBtn = el("button", { textContent: "Load this URL" });
        loadBtn.addEventListener("click", () => loadEntity(toUri(urlInput.value)));
        panel.appendChild(el("div", { className: "r" }, [
            el("div", { textContent: "Name" }), nameInput,
            el("div", { textContent: "Model URL (.glb)", style: "margin-top:6px" }), urlInput, loadBtn
        ]));

        // Local file
        const fileInput = el("input", { type: "file", accept: ".glb" });
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(file);
            loadEntity(objectUrl);
        });
        panel.appendChild(el("div", { className: "r" }, [
            el("div", { textContent: "…or test a local .glb (nothing is uploaded; only you see it)" }), fileInput
        ]));

        // Sliders + number inputs
        FIELDS.forEach(f => {
            const range = el("input", { type: "range" });
            const num = el("input", { type: "number", step: String(f.step) });
            const onChange = (value) => {
                if (Number.isNaN(value)) return;
                cfg[f.key] = value;
                applyModel();
                syncControls(f.key);
            };
            range.addEventListener("input", () => onChange(parseFloat(range.value)));
            num.addEventListener("change", () => onChange(parseFloat(num.value)));
            controls.push({ f: f, range: range, num: num });
            panel.appendChild(el("div", { className: "r" }, [
                el("div", { textContent: f.label }), el("div", { className: "l" }, [range, num])
            ]));
        });

        // Height mode
        modeSelect = el("select");
        [["absolute", "Absolute altitude"], ["relative", "Relative to terrain"], ["clamp", "Clamp to terrain"]]
            .forEach(([v, t]) => modeSelect.appendChild(el("option", { value: v, textContent: t })));
        modeSelect.value = cfg.mode;
        modeSelect.addEventListener("change", () => { cfg.mode = modeSelect.value; applyModel(); refreshOutput(); });
        panel.appendChild(el("div", { className: "r" }, [el("div", { textContent: "Height mode" }), modeSelect]));

        // Output + buttons
        outputBox = el("textarea", { readOnly: true });
        const copyBtn = el("button", { textContent: "Copy config for the public addon" });
        copyBtn.addEventListener("click", copyConfig);
        const recentreBtn = el("button", { textContent: "Re-centre sliders on current values", className: "alt" });
        recentreBtn.addEventListener("click", () => { Object.assign(home, cfg); syncControls(); });
        const resetBtn = el("button", { textContent: "Reset to starting values", className: "alt" });
        resetBtn.addEventListener("click", () => {
            Object.assign(cfg, MODEL);
            Object.assign(home, MODEL);
            nameInput.value = cfg.name;
            urlInput.value = cfg.url;
            applyModel();
            syncControls();
        });
        panel.appendChild(el("div", { className: "r" }, [outputBox, copyBtn, recentreBtn, resetBtn]));

        document.body.appendChild(panel);

        const toggle = el("div", { id: "gdt-toggle", textContent: "🛠 GEO-PORTS DEV" });
        toggle.addEventListener("click", () => {
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
        document.body.appendChild(toggle);

        // Keep typing in the panel from triggering GeoFS key bindings
        ["keydown", "keyup", "keypress"].forEach(t => panel.addEventListener(t, e => e.stopPropagation()));

        makeDraggable(panel, head);
        syncControls();
    }

    function syncControls(skipKey) {
        controls.forEach(({ f, range, num }) => {
            const r = rangeFor(f);
            const v = cfg[f.key];
            range.min = String(Math.min(r.min, v)); // widen if a typed value is outside the range
            range.max = String(Math.max(r.max, v));
            range.step = String(f.step);
            if (f.key !== skipKey || document.activeElement !== num) num.value = v.toFixed(f.dec);
            range.value = String(v);
        });
        refreshOutput();
    }

    function refreshOutput() {
        outputBox.value =
`{
    name: "${cfg.name}",
    url: "${cfg.url}",
    lat: ${cfg.lat.toFixed(6)},
    lon: ${cfg.lon.toFixed(6)},
    alt: ${cfg.alt.toFixed(2)},
    heading: ${cfg.heading.toFixed(1)},
    scale: ${cfg.scale.toFixed(3)},
    mode: "${cfg.mode}"
}`;
    }

    function copyConfig() {
        const text = outputBox.value;
        const fallback = () => { outputBox.select(); document.execCommand("copy"); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(fallback);
        } else {
            fallback();
        }
    }

    function makeDraggable(box, handle) {
        let dragging = false, dx = 0, dy = 0;
        handle.addEventListener("mousedown", e => {
            dragging = true;
            const r = box.getBoundingClientRect();
            dx = e.clientX - r.left;
            dy = e.clientY - r.top;
            e.preventDefault();
        });
        document.addEventListener("mousemove", e => {
            if (!dragging) return;
            box.style.left = (e.clientX - dx) + "px";
            box.style.top = (e.clientY - dy) + "px";
            box.style.right = "auto";
        });
        document.addEventListener("mouseup", () => { dragging = false; });
    }
})();
