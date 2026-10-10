*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

![Photograph a tree, get a Roots bomb, close the block](https://raw.githubusercontent.com/crjstobal/street-bomber/main/media/street-bomber-block.gif)

## What I Built

**Street Bomber** is Bomberman played on the real streets around you.

The map is your neighbourhood. Every crossing is a place to plant a bomb, and the blast runs down the real street in a straight line, like the original game. The twist: **you have no bombs until you go outside and find one.** You walk to a corner, photograph whatever is there, and an open-weight vision model running on your phone turns it into a bomb:

| You photograph | You get | What it does |
|---|---|---|
| ⚡ Lamp post | **Spark** | Runs down the whole street, straight |
| 🚦 Traffic light | **Crossfire** | Turns every corner, takes the area around it |
| 🌳 Tree | **Roots** | Keeps growing into the streets next to it |
| ♻️ Bin | **Scrap** | Gives you one bomb back |
| 💧 Fountain | **Flood** | Washes rival streets back to neutral |
| 🛡️ Bench | **Fort** | Its streets can't be stolen for 5 minutes |
| Anything else | 🧨 Firecracker | Just your corner. Get closer to something real. |

Own every street around a city block and **the whole block is yours**. The blocks are computed from the street graph itself, so any neighbourhood on Earth works.

Two rules exist only to get you off the screen:

- **One bomb a day.** You can save up to three. Closing a block or recycling a bin earns one back.
- **One object, one corner.** The same kind of object on the same corner is spent for 6 hours. You will start noticing which corners have a fountain.

Everything you weaponise goes into a **street album** with your own photo. Your streets stay yours until a rival bombs them.

It is for anyone who already walks the dog, goes for a run or does the school run and would like a reason to take the long way round.

## Demo

**Play it:** https://crjstobal.github.io/street-bomber/

- On a phone, outside: allow location and camera, walk to a crossing, press **Plant bomb**.
- At a desk: without GPS it opens a demo city (central Madrid). Click the map or use WASD to walk, and feed the camera a photo file. Demo mode recharges bombs every 15 seconds.
- The first visit downloads the vision model once (99 MB, then cached), so use Wi-Fi.

{% vimeo https://vimeo.com/1234693434 %}

A note on the video: **real streets are private data**, so I recorded it in demo mode, in central Madrid, with a simulated camera fed with Wikimedia Commons photos. The model is real: every frame you see classified was classified by SigLIP in the browser.

## Code

{% embed https://github.com/crjstobal/street-bomber %}

No build step, no backend. One HTML file, one ES module for vision, and two small scripts that precompute data. MIT licensed.

## How I Built It

**The street graph.** The game asks OpenStreetMap (through the Overpass API) for every walkable street within 500 m, then turns it into a graph: crossings are nodes, stretches of street are edges. A blast follows a street from a crossing and keeps going straight through the next crossings as long as it doesn't have to turn more than about 60°. City blocks are the *faces* of that planar graph, found by walking every half-edge and always taking the next turn. Central Madrid alone has 174 of them.

**The eyes.** I tested three open models on 32 street photos before picking one:

| Model | Correct | Notes |
|---|---|---|
| CLIP ViT-B/32 | 26/32 | fast, but every tree failed |
| CLIP ViT-B/16 | 28/32 | |
| **SigLIP base** | **30/32** | the two "misses" were wide shots of an avenue |

SigLIP runs in the browser with **Transformers.js** on WASM, int8 quantised. Classification is zero-shot: I describe each object in a few phrases ("a lamp post", "a street light pole"…) and compare the photo against them. I also added *decoy* classes (a wall, a building, a car, a person, the pavement) so a random shot falls back to a firecracker instead of being forced into the closest bomb. Below a confidence threshold it tells you to get closer.

**The trick that open weights made possible.** SigLIP has two halves: one that reads text, one that looks at images. My text never changes (it's the same object descriptions for every player), so I run the text half **once, on my laptop**, and ship the result as a 184 KB JSON file. The phone downloads **only the vision half: 99 MB instead of 211 MB**, and a photo takes about a second. You can't split a model you can't download.

**Saving.** Progress, the album (with small thumbnails) and the street map of your area live in the browser's local storage, on your phone only.

## Why Does Open Innovation Matter?

Look at what this game handles: **photos of the street you live on, tagged with where you were standing.** That is about as sensitive as personal data gets. With an open-weight model running on the device, the honest answer to "where do my photos go?" is: nowhere. There is no server. I didn't have to write a privacy policy because there is nothing to protect.

It also matters for the shape of the game:

- **It costs nothing per player.** A closed vision API would charge for every photo of every player, forever. That's the difference between a game anyone can host on GitHub Pages and one that needs a business model.
- **I could take the model apart.** Precomputing the text side and shipping only the vision encoder is what made it phone-sized. That needs the weights.
- **Anyone can add a bomb.** A new object (a post box, a statue) is one line of text in `classes.json` and one script run. No retraining, no permission, no API change.
- **It works with bad signal.** Once the model is cached, recognising objects needs no network at all. Only the street map does, and it's cached per area.

The map data is open too: the whole game exists because people mapped their streets on OpenStreetMap.

## I took it outside

I tested the first version on my own phone, around my own streets. It was fun, and it was also clearly unfinished. That walk changed the game more than any planning did:

- **The first load was slow**, because the game asks a public OpenStreetMap server for every street around you. Now the street map is cached per area, and the second visit is instant.
- **Closing the app lost everything.** Now your territory, your bombs and your album are saved on the phone.
- **Painting streets had no goal.** Closing whole blocks came straight out of that walk, and it is now the heart of the game.
- **It should pull you back outside, not keep you on the screen.** So: one bomb a day, and streets that stay yours until someone takes them. The game wants you to come back tomorrow, on foot.

I'm not showing footage of that walk. Those are my streets, and that is exactly the kind of data this game is built to keep private.

## Credits

Street photos in the demo video come from Wikimedia Commons: street tree by Fons Heijnsbroek (CC0), traffic light in Darwin by Dietmar Rabich (CC BY-SA 4.0). Map data © OpenStreetMap contributors. Voice-over generated with ElevenLabs.

Go outside. Take your block.
