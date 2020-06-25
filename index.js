const gemVerify = require('./src/verifyConditions');
const gemPrepare = require('./src/prepare');
const gemPublish = require('./src/publish');

let gemName;
let gemspec;
let versionFile;
let gemFile;

async function verifyConditions(pluginConfig, context) {
  ({ gemName, gemspec, versionFile } = await gemVerify(pluginConfig, context));
}

async function prepare(pluginConfig, context) {
  ({ gemFile } = await gemPrepare(pluginConfig, context, { versionFile, gemspec, gemName }));
}

async function publish(pluginConfig, context) {
  await gemPublish(pluginConfig, context, { gemFile, gemName });
}

module.exports = { verifyConditions, prepare, publish };
