/* gen-checkout.mjs - imported first by every test file. In the game's source
 * checkout only, it builds the generated API outputs and the AI pack the tests
 * read (they are not committed). Anywhere else (the public mods
 * repository's cli/ folder) it does nothing. A side-effect import, not an npm
 * pretest: package.json is in the package, and a change to it is a new build. */
import { spawnSync } from 'node:child_process';
import { CHECKOUT } from '../lib/checkout.mjs';

if (CHECKOUT) {
  const r = spawnSync(process.execPath, [CHECKOUT.gen], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) throw new Error(`node ${CHECKOUT.gen} failed (exit ${r.status ?? r.signal})`);
}
