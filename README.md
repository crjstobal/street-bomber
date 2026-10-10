# Street Bomber

Bomberman on your real streets. Walk to a corner, photograph what is there, and an
open vision model running **on your phone** turns it into your bomb. A lamp post
becomes a blast that runs the whole street; a tree grows roots into the next block;
a bin recycles into more ammo.

Built for the DEV Hacktoberfest 2026 Open-Source AI Challenge, Week 1: *Touch Grass*.

## How it plays

- The map is your neighbourhood: real streets from OpenStreetMap, crossings are where you plant.
- You must physically be at a crossing (GPS) and take a live photo there.
- The photo decides the bomb:

| You photograph | Bomb | Effect |
|---|---|---|
| Lamp post | ⚡ Spark | Runs down the whole street in a straight line |
| Traffic light | 🚦 Crossfire | Turns every corner, takes the whole block |
| Tree | 🌳 Roots | Keeps growing into neighbouring streets |
| Bin | ♻️ Scrap | Gives you one bomb back right away |
| Fountain | 💧 Flood | Washes rival streets back to neutral, drowns their bombs |
| Bench | 🛡️ Fort | Streets it takes cannot be stolen for 5 minutes |
| Anything else | 🧨 Firecracker | Just the corner you stand on |

- **Close the block.** Own every street around a city block and the whole block fills
  with your colour (+1 bomb). Blocks are computed from the street graph itself.
- **One object, one corner.** The same kind of object on the same corner is spent for
  6 hours, so the game keeps pushing you to explore.
- **Street album.** Every kind of object you have weaponised, with your own photo.
- **One bomb a day.** In real GPS play you get a new bomb every 24 hours (stock of up to 3,
  starter pack of 3). Closing a block or recycling a bin earns one back. The point is to
  make you go outside again tomorrow, not to keep you on the screen today.
- Progress is saved on the phone. Streets stay yours until a rival bombs them. Demo mode (desk play) recharges every 15 s so anyone can try it. Two simple rival bots (random walkers, not AI) keep the map moving.

## The open AI part

- Model: [SigLIP base](https://huggingface.co/Xenova/siglip-base-patch16-224) (open weights),
  run in the browser with [Transformers.js](https://github.com/huggingface/transformers.js) on WASM.
- Only the **vision encoder** ships to the phone (99 MB, int8, downloaded once and cached).
  The text side (one embedding per class prompt) is precomputed by `tools/build-embeds.mjs`
  into `web/text_embeds.json`.
- Classification is a cosine similarity against those prompts, plus "decoy" classes
  (wall, building, car, person, pavement) so random shots fall back to a firecracker
  instead of being forced into a bomb. About 1 s per photo on a laptop browser.
- **No photo and no location ever leave the device.** There is no backend.

## Run it

Any static server works (camera and GPS need `https` or `localhost`):

```bash
cd web && python3 -m http.server 8000
# open http://localhost:8000
```

Without GPS it loads a baked demo city (central Madrid, `web/demo-streets.json`).
In **Demo** mode you walk with click or WASD and can feed the camera a photo file.

## Rebuild the data

```bash
cd tools && npm i @huggingface/transformers
node build-embeds.mjs          # after editing tools/classes.json
node build-demo-streets.mjs    # optional: [lat] [lon] for another demo city
```

## Demo footage

`media/street-bomber-block.gif` is recorded in demo mode (central Madrid, simulated camera)
so no real player's streets appear. Camera photos in it come from Wikimedia Commons:
street tree by Fons Heijnsbroek (CC0); traffic light in Darwin by Dietmar Rabich (CC BY-SA 4.0).

## License

MIT. Map data © OpenStreetMap contributors (ODbL).
