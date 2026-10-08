// On-device street-object recognition.
// SigLIP vision encoder runs in the browser (WASM). Text embeddings for every
// class prompt are precomputed by tools/build-embeds.mjs, so the phone never
// downloads the text encoder and no photo ever leaves the device.
import { AutoProcessor, SiglipVisionModel, RawImage, env }
  from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1';

env.allowLocalModels = false;

const MODEL_ID = 'Xenova/siglip-base-patch16-224';
const MIN_SCORE = 0.075;   // below this the shot is too far / too blurry to trust
const TEMPERATURE = 60;    // turns cosine gaps into a readable confidence

let processor = null, model = null, text = null, loading = null;

export function loadVision(onProgress) {
  if (loading) return loading;
  loading = (async () => {
    const files = new Map();
    const progress_callback = p => {
      if (p.status !== 'progress' || !p.total) return;
      files.set(p.file, [p.loaded, p.total]);
      let l = 0, t = 0;
      for (const [a, b] of files.values()) { l += a; t += b; }
      onProgress?.(l / t, t);
    };
    const [emb, proc, vm] = await Promise.all([
      fetch('text_embeds.json').then(r => r.json()),
      AutoProcessor.from_pretrained(MODEL_ID, { progress_callback }),
      SiglipVisionModel.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'wasm', progress_callback }),
    ]);
    text = emb; processor = proc; model = vm;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

export const visionReady = () => !!model;

// source: canvas, image element, blob or URL. Returns
// { cls, confidence, score, ranked:[[cls,score],...], ms }; cls is null when
// nothing in the photo is a usable street object.
export async function classify(source) {
  await loadVision();
  const t0 = performance.now();
  const image = await toRawImage(source);
  const { pooler_output } = await model(await processor(image));
  const v = pooler_output.normalize(2, -1).data;

  const best = {};
  text.prompts.forEach(([cls], i) => {
    const e = text.embeds[i];
    let s = 0;
    for (let j = 0; j < e.length; j++) s += e[j] * v[j];
    if (!(cls in best) || s > best[cls]) best[cls] = s;
  });
  const ranked = Object.entries(best).sort((a, b) => b[1] - a[1]);

  const z = ranked.map(([, s]) => Math.exp((s - ranked[0][1]) * TEMPERATURE));
  const sum = z.reduce((a, b) => a + b, 0);
  const [topCls, topScore] = ranked[0];
  const usable = !topCls.startsWith('_') && topScore >= MIN_SCORE;

  return {
    cls: usable ? topCls : null,
    seen: topCls,
    confidence: z[0] / sum,
    score: topScore,
    ranked,
    ms: Math.round(performance.now() - t0),
  };
}

async function toRawImage(src) {
  if (src instanceof HTMLCanvasElement) {
    const blob = await new Promise(r => src.toBlob(r, 'image/jpeg', 0.9));
    return RawImage.fromBlob(blob);
  }
  if (src instanceof Blob) return RawImage.fromBlob(src);
  if (src instanceof HTMLImageElement) return RawImage.fromURL(src.src);
  return RawImage.fromURL(src);
}
