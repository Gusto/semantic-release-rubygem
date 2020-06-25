const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const execa = require('execa');

const writeVersion = async ({ versionFile, nextVersion, logger, cwd }) => {
  const fullVersionPath = path.resolve(cwd, versionFile);
  const versionContents = await readFile(fullVersionPath, 'utf8');
  const newContents = versionContents.replace(
    /(VERSION = ['"])[0-9.]*(['"])/,
    `$1${nextVersion}$2`,
  );
  logger.log('Writing version %s to `%s`', nextVersion, versionFile);
  // TODO: Check to insure the contents changed. Or, maybe verify the format of the version in verify?
  await writeFile(fullVersionPath, newContents, 'utf8');
};

const bundleInstall = async ({ updateGemfileLock, cwd, env }) => {
  if (typeof updateGemfileLock === 'string') {
    await execa.command(updateGemfileLock, { cwd, env });
  } else {
    await execa('bundle', ['install'], { cwd, env });
  }
};

const buildGem = async ({ gemspec, gemName, version, cwd, env }) => {
  const gemFile = `${gemName}-${version}.gem`;
  await execa('gem', ['build', gemspec, '-o', gemFile], { cwd, env });

  return gemFile;
};

module.exports = async function prepare(
  pluginConfig,
  { nextRelease: { version }, cwd, env, logger },
) {
  const { versionFile, gemspec, gemName, updateGemfileLock = false } = pluginConfig;
  await writeVersion({ versionFile, nextVersion: version, logger, cwd });

  if (updateGemfileLock) {
    await bundleInstall({ updateGemfileLock, cwd, env });
  }

  const gemFile = await buildGem({ gemspec, gemName, version, cwd, env });
  // eslint-disable-next-line no-param-reassign
  pluginConfig.gemFile = gemFile;
};
