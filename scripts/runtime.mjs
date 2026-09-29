import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const root = new URL('../', import.meta.url).pathname;
const supports = version => {
  const [major, minor] = version.replace(/^v/, '').split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 12);
};

let node = process.execPath;
if (!supports(process.version)) {
  const versionsRoot = join(process.env.NVM_DIR || join(homedir(), '.nvm'), 'versions', 'node');
  const versions = existsSync(versionsRoot)
    ? readdirSync(versionsRoot).filter(supports).sort((a,b) => b.localeCompare(a, undefined, {numeric:true}))
    : [];
  node = versions.map(version => join(versionsRoot, version, 'bin', 'node')).find(existsSync) || '';
  if (!node) {
    console.error(`This project needs Node 22.12 or newer. Your terminal uses ${process.version}. Run: nvm install 22 && nvm use 22`);
    process.exit(1);
  }
  console.log('Using Node 22 for this project; your shell default is unchanged.');
}

const run = (file, args=[]) => {
  const result = spawnSync(node, [file, ...args], {cwd:root, stdio:'inherit', env:{...process.env, PATH:`${dirname(node)}:${process.env.PATH || ''}`}});
  process.exit(result.status ?? 1);
};
const packageFile = (name, file) => join(dirname(require.resolve(`${name}/package.json`)), file);
switch (process.argv[2]) {
  case 'build': run(packageFile('typescript','bin/tsc'),['-b','frontend']); break;
  case 'vite-build': run(packageFile('vite','bin/vite.js'),['build','frontend','--config','frontend/vite.config.ts']); break;
  case 'dev': run(join(root,'scripts/dev.mjs')); break;
  case 'start': run(join(root,'scripts/start.mjs')); break;
  default: process.exit(1);
}
