// Precomputes the SigLIP text embeddings for every class prompt.
// Runs once on a dev machine; the phone only ever downloads the vision encoder.
//   cd tools && npm i @huggingface/transformers && node build-embeds.mjs
import { AutoTokenizer, SiglipTextModel } from '@huggingface/transformers';
import fs from 'fs';

const ID = 'Xenova/siglip-base-patch16-224';
const CLASSES = JSON.parse(fs.readFileSync(new URL('./classes.json', import.meta.url)));

const prompts = [];
for (const [cls, phrases] of Object.entries(CLASSES))
  for (const p of phrases) prompts.push([cls, `a photo of ${p}.`]);

const tokenizer = await AutoTokenizer.from_pretrained(ID);
const model = await SiglipTextModel.from_pretrained(ID, { dtype: 'fp32' });
const inputs = tokenizer(prompts.map(p => p[1]), { padding: 'max_length', truncation: true });
const { pooler_output } = await model(inputs);
const embeds = pooler_output.normalize(2, -1).tolist().map(v => v.map(x => +x.toFixed(5)));

fs.writeFileSync(new URL('../web/text_embeds.json', import.meta.url),
  JSON.stringify({ model: ID, prompts, embeds }));
console.log(`wrote ${prompts.length} prompt embeddings`);
