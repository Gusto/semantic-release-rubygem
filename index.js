import { temporaryFile } from 'tempy';
import gemVerify from './src/verifyConditions.js';
import gemPrepare from './src/prepare.js';
import gemPublish from './src/publish.js';

const credentialsFile = temporaryFile({ name: 'gem_credentials' });
let gemName;
let gemspec;
let versionFile;
let gemFile;

async function verifyConditions(pluginConfig, context) {
  ({ gemName, gemspec, versionFile } = await gemVerify(pluginConfig, context, { credentialsFile }));
}

async function prepare(pluginConfig, context) {
  ({ gemFile } = await gemPrepare(pluginConfig, context, { versionFile, gemspec, gemName }));
}

async function publish(pluginConfig, context) {
  await gemPublish(pluginConfig, context, { gemFile, gemName, credentialsFile });
}

export { verifyConditions, prepare, publish };
