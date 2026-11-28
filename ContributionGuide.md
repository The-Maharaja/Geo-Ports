# Contributing to Geo-ports

Geo-ports adds custom airport buildings to [GeoFS](https://www.geo-fs.com). Anyone can contribute a model. The process has four steps:

1. [Model it](#step-1--model-it)
2. [Host the `.glb` on GitHub](#step-2--host-the-glb-on-github)
3. [Place it with the Geo-ports Dev Tool](#step-3--place-it-with-the-geo-ports-dev-tool)
4. [Send it to us](#step-4--send-it-to-us)

---

## Step 1 — Model it

Build your building in Blender (or any 3D tool that exports glTF) and export it as a **`.glb`** file.

**Modelling checklist**

- **Real-world scale.** Use 1 unit = 1 metre and model at the building's true size.
- **Origin at the centre of the footprint, at ground level.** The coordinates you set later point at the model's origin, so a sensible origin makes placement much easier.
- **Apply transforms and modifiers** before export (scale, rotation, any modifiers).
- **Model the building only.** No terrain, no lights, no cameras, no hidden or leftover objects.
- **Give it a foundation.** GeoFS terrain is uneven, so a large flat base can end up partly underground or floating. Extend a thick foundation or skirt well below the lowest point of the base so there are never gaps.
- **Keep textures sensible.** Use 2048×2048 or smaller where you can, and avoid giant solid-colour textures (a fully black 8192×8192 image still costs a lot of memory). Re-use textures and materials instead of duplicating them.
- **Export settings (Blender):** File → Export → glTF 2.0 → format **glTF Binary (.glb)**. This embeds the textures inside the single file.
- **File size: keep it under 20 MB.** That is the per-file limit of the free CDN we load models from. Smaller loads faster for everyone.
- **File name: no spaces.** Use something like `Delhi_ATC.glb`.

**Tip: shrinking a heavy file.** Running a `.glb` through [glTF-Transform](https://gltf-transform.dev/) (`dedup` then `prune`) merges duplicate data and removes unused data without reducing quality. It can cut large exports a lot.

**Permission and credit.** Only submit models you made yourself or have written permission to share. List everyone who worked on the model so we can credit them.

---

## Step 2 — Host the `.glb` on GitHub

1. Create a **public** GitHub repository for your model (for example `Geofs-Delhi-ATC`).
2. Click **Add file → Upload files**, drop in your `.glb`, and commit.
3. Your model's URL has this form:

   ```
   https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/FILENAME.glb
   ```

4. Open that URL in a browser tab. If the file downloads, it works.

If you replace the file later and still see the old one, the CDN is serving a cached copy. Pin the URL to a commit hash instead of `@main` (click the file's **History**, copy the short commit hash, and use `@abc1234`).

---

## Step 3 — Place it with the Geo-ports Dev Tool

The Dev Tool is a userscript that loads **one model at a time** in GeoFS and gives you sliders to place it. At the end it gives you a block of code to send to us.

**Setup (once)**

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Install the **Geo-ports Dev Tool** script: [geo-ports-dev-tool.user.js](https://raw.githubusercontent.com/The-Maharaja/Geo-Ports/main/geo-ports-dev-tool.user.js) (Tampermonkey will offer to install it).
3. If you also run the public Geo-ports script, turn it off while you test so nothing loads twice. The same goes for other airport-building addons.

**Placing your model**

1. Open GeoFS. Click **🛠 GEO-PORTS DEV** at the top right to open the panel.
2. Enter a **Name** and paste your model's **URL**, then click **Load this URL**. You can also test a local `.glb` from your computer with the file picker, which only you can see and which uploads nothing.
3. Find the real-world position. In Google Maps, right-click the building's centre and click the coordinates to copy them. Type the latitude and longitude into the two number boxes.
4. Fine-tune with the sliders, checking from several angles and altitudes:
   - **Latitude / Longitude** to line it up with the ground and neighbouring buildings.
   - **Altitude** so the base sits on the ground. Raise it until nothing is buried, relying on your foundation to fill any gap.
   - **Heading** to rotate it into the right orientation.
   - **Scale** should stay at `1` if you modelled at true size.
   - Click **Re-centre sliders on current values** if you need more range, or type a value into the number box.
5. Leave **Height mode** on *Absolute altitude* unless a maintainer tells you otherwise.
6. When it looks right, click **Copy config for the public addon**.

If you can, check it on both the current GeoFS release and the beta.

---

## Step 4 — Send it to us

Send us three things: the **config block** you copied, your **model's URL**, and **credits** for everyone who worked on it. Screenshots from a couple of angles help us check it quickly.

Pick whichever is easiest:

- **Discord (easiest):** message **`the_maharaja`** and send the config block, the URL and your credits.
- **GitHub (Issue):** open a new **Issue** on the Geo-ports repository and paste the details there. An Issue is just a public message to the maintainers. Use this template:

  ```
  Airport (ICAO): .....
  Model name: ....
  Credits: <who made it>
  Permission: I made this / I have permission from <name>
  Model URL: https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/FILENAME.glb

  Config:
  {
      name: "...",
      url: "...",
      lat: 0.000000,
      lon: 0.000000,
      alt: 0.00,
      heading: 0.0,
      scale: 1.000,
      mode: "absolute"
  }

  Screenshots: <attach 2-3>
  ```

- **GitHub (Pull Request, if you're comfortable with it):** add your config block to the `MODELS` list in `geo-ports.user.js` and open a **Pull Request** (a proposed change to the code).

**What happens next.** If your building replaces one GeoFS already has, say so in your message; we can hide the default buildings by blocking the map tile that holds them. We check your model in GeoFS, may adjust the position slightly, and set its `loadRadius` (how far away it starts to load) so it performs well. Once it's added, you'll be credited in the script. We may ask you to optimise a model that's too heavy, or decline one that hurts performance or whose permissions aren't clear.

---

## Before you submit — checklist

- [ ] Modelled at real-world scale, with the origin at the centre of the footprint at ground level
- [ ] Has a foundation, with no gaps on uneven terrain
- [ ] `.glb` is under 20 MB and the file name has no spaces
- [ ] Hosted in a public GitHub repo, and the URL downloads the file
- [ ] Placed with the Dev Tool and checked from several angles
- [ ] Config block copied
- [ ] Credits and permission stated

Thank you for helping build Geo-ports!
