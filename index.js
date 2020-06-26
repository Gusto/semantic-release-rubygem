const tempy = require('tempy');
const gemVerify = require('./src/verifyConditions');
const gemPrepare = require('./src/prepare');
const gemPublish = require('./src/publish');

const credentialsFile = tempy.file({ name: 'gem_credentials' });
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

module.exports = { verifyConditions, prepare, publish };
