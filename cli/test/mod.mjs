/* mod.mjs - small working mods for the tests, one per kind. */
import fs from 'node:fs';
import path from 'node:path';
import { mods } from '../lib/contract.mjs';

export const KINDS = ['texture', 'lines', 'shop', 'script'];

const json = (v) => `${JSON.stringify(v, null, 2)}\n`;

/* An uncompressed 32-bit DDS, pixels R G B A (what pc_texderive_dds_format reads). */
export function dds(w, h, rgba) {
  const hdr = Buffer.alloc(128);
  hdr.write('DDS ', 0, 'ascii');
  hdr.writeUInt32LE(124, 4);
  hdr.writeUInt32LE(0x100f, 8);
  hdr.writeUInt32LE(h, 12);
  hdr.writeUInt32LE(w, 16);
  hdr.writeUInt32LE(w * 4, 20);
  hdr.writeUInt32LE(32, 76);
  hdr.writeUInt32LE(0x41, 80);
  hdr.writeUInt32LE(32, 88);
  hdr.writeUInt32LE(0x000000ff, 92);
  hdr.writeUInt32LE(0x0000ff00, 96);
  hdr.writeUInt32LE(0x00ff0000, 100);
  hdr.writeUInt32LE(0xff000000, 104);
  hdr.writeUInt32LE(0x1000, 108);
  return Buffer.concat([hdr, Buffer.from(rgba)]);
}

/* The town grass, under any palette ("$"). */
export const GRASS_TEXTURE = 'tex1_32x32_626709d910129694_$_8.dds';

/* The files of a working mod of kind, as {path: string|Buffer}. */
export function modFiles(id, kind) {
  const manifest = {
    schema: 1, api: mods.API_MAX, id, name: 'Test Mod', version: '0.1.0', authors: ['bean'],
    description: 'A test mod.', scope: kind === 'shop' ? 'world' : 'client', content: {}, assets_original: true,
  };
  const files = {};
  if (kind === 'texture') {
    manifest.content.textures = 'textures';
    files[`textures/${GRASS_TEXTURE}`] = dds(32, 32, new Uint8Array(32 * 32 * 4).fill(200));
  }
  if (kind === 'lines') {
    manifest.content.messages = 'messages/en.json';
    manifest.scripts = { main: 'main.lua', events: ['villager_talked'] };
    files['messages/en.json'] = json({ line1: 'Hello there.' });
    files['main.lua'] = 'on("villager_talked", function(e)\n  return message("line1")\nend)\n';
  }
  if (kind === 'shop') {
    manifest.content.shops = 'shops.json';
    files['shops.json'] = json({ shops: [{ target: 'flower', mode: 'replace', name: 'Test Shop', stock: [{ item: '0x2800', price: 600 }] }] });
  }
  if (kind === 'script') {
    manifest.scripts = { main: 'main.lua', events: ['day_started'] };
    files['main.lua'] = 'on("day_started", function(e)\n  store.set("days", (store.get("days") or 0) + 1)\nend)\n';
  }
  if (!Object.keys(manifest.content).length) delete manifest.content;
  files['mod.json'] = json(manifest);
  files['README.md'] = '# Test Mod\n';
  return files;
}

export function writeFiles(dir, files) {
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
}
