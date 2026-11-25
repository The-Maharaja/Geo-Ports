# Geo-Ports-GeoFS-Buildings-
A whole new addon to import buildings to the web browser flight simulator for the buildings that are broken.
# ✈️ Geo-ports

**Custom airport buildings for [GeoFS](https://www.geo-fs.com).** Hand-modelled terminals and towers, placed where they stand in the real world, loaded only when you're close enough to see them.

<!-- Add a hero screenshot here, e.g. the Delhi ATC tower at sunset:
![Delhi ATC tower in GeoFS](docs/screenshot-atc.png) -->

---

## What you get

- **Real, detailed buildings** that GeoFS doesn't have by default, modelled by the community.
- **Light on your system.** Models load by distance. Fly 20 km from an airport and nothing from it is loaded. Models stream in one at a time as you approach, so busy airports don't freeze the game.
- **Nothing to configure.** Install it, load GeoFS, fly.

## Available now

| Airport | Building | Status |
| --- | --- | --- |
| Delhi (VIDP) | ATC Tower | ✅ Available |

More buildings and airports are on the way. Want to add one? See [Contributing](#contributing).

---

## Install

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2. Open the script link: **`LINK-TO-SCRIPT`** *(maintainers: replace with the raw link, `https://raw.githubusercontent.com/USER/REPO/main/geo-ports.user.js`)*
3. Click **Install** in the Tampermonkey tab that opens.
4. Open [GeoFS](https://www.geo-fs.com) and fly to an airport on the list above.

Tampermonkey checks for new versions automatically, so new buildings appear without you reinstalling anything.

**Tested on** GeoFS 3.9 and the 4.0 beta.

---

## Troubleshooting

**I don't see a building.**
- Check that Tampermonkey is enabled and that **Geo-ports** shows as on for the GeoFS page.
- Fly closer. Models only load within their load distance, and it can take a few seconds after you arrive.
- Press **F12**, open the **Console** tab, and look for lines starting with `[Geo-ports]`. They say what loaded and what failed.

**Buildings look doubled.**
- Another airport-building addon is probably adding the same building. Turn one of them off.

**It's in the wrong place or floating or sunk.**
- Please [open an issue](../../issues) with the airport, the building and a screenshot. Positions are tuned by hand and we're glad to fix them.

---

## Contributing

Geo-ports is community-built. If you can model, you can add a building:

1. **Model it** in Blender and export a `.glb`.
2. **Host it** on GitHub.
3. **Place it** with the Geo-ports Dev Tool.
4. **Send it to us** through Discord or a GitHub issue.

The full steps are in the **[Contribution Guide](ContributionGuide.md)**.

---

## Credits

- **Delhi ATC Tower:** *(add the modeller's name)*
- **Script:** *(add your name)*

Everyone who contributes a model is credited here.

## Contact

- Discord: **`the_maharaja`**
- GitHub: [open an issue](../../issues)

## License

*(Choose a license, and state here whether the models are covered by it or have their own terms.)*

---

*Geo-ports is a community project. It is not affiliated with or endorsed by GeoFS.*
