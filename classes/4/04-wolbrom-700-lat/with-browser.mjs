// Reuse repository browser discovery without changing shared runners.
import {chromium} from 'playwright';
import {localChromiumExecutable} from '../../../test/support/local-chromium.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const executablePath=await localChromiumExecutable(root),launch=chromium.launch.bind(chromium);
chromium.launch=opts=>launch({...opts,executablePath});
const target=path.resolve(process.argv[2]);
process.argv=[process.execPath,target,...process.argv.slice(3)];
await import(pathToFileURL(target).href);
