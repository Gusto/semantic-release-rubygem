const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const execa = require('execa');
const { move } = require('fs-extra');
const { VERSION_REGEX } = require('./common');

const writeVersion = async ({ versionFile, nextVersion, logger, cwd }) => {
  // Rubygems replaces all `-` with `.pre.`, which causes odd version differences between tags/releases
  // and the published gem version. Replacing `-` with `.` is a smaller difference.
  const gemVersion = nextVersion.replace('-', '.');
  const fullVersionPath = path.resolve(cwd, versionFile);
  const versionContents = await readFile(fullVersionPath, 'utf8');
  const newContents = versionContents.replace(VERSION_REGEX, `$1${gemVersion}$2`);
  logger.log('Writing version %s to `%s`', nextVersion, versionFile);
  await writeFile(fullVersionPath, newContents, 'utf8');

  return { gemVersion };
};

const bundleInstall = async ({ updateGemfileLock, cwd, env, logger, stdout, stderr }) => {
  const command = typeof updateGemfileLock === 'string' ? updateGemfileLock : 'bundle install';
  logger.log('Updating lock file with command `%s`', command);
  const installResult = execa.command(command, { cwd, env });
  installResult.stdout.pipe(stdout, { end: false });
  installResult.stderr.pipe(stderr, { end: false });

  await installResult;
};

const buildGem = async ({ gemspec, gemName, version, cwd, env, logger, stdout, stderr }) => {
  const gemFile = `${gemName}-${version}.gem`;
  // TODO: Parse the gem file name from the output?
  logger.log('Building gem `%s`', gemFile);
  const buildResult = execa('gem', ['build', gemspec], { cwd, env });
  buildResult.stdout.pipe(stdout, { end: false });
  buildResult.stderr.pipe(stderr, { end: false });
  await buildResult;

  return gemFile;
};

module.exports = async function prepare(
  { updateGemfileLock = false, gemFileDir = false, pkgRoot },
  { nextRelease: { version }, cwd, env, logger, stdout, stderr },
  { versionFile, gemspec, gemName },
) {
  const gemSpecPkgRoot = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;

  const { gemVersion } = await writeVersion({
    versionFile,
    nextVersion: version,
    logger,
    cwd: gemSpecPkgRoot,
  });

  if (updateGemfileLock) {
    await bundleInstall({ updateGemfileLock, cwd: gemSpecPkgRoot, env, logger, stdout, stderr });
  }

  let gemFile = await buildGem({
    gemspec,
    gemName,
    version: gemVersion,
    cwd: gemSpecPkgRoot,
    env,
    logger,
    stdout,
    stderr,
  });

  if (gemFileDir) {
    const gemFileSource = path.resolve(gemSpecPkgRoot, gemFile);
    const gemFileDestination = path.resolve(gemSpecPkgRoot, gemFileDir.trim(), gemFile);

    // Only move the gem file if we need to
    if (gemFileSource !== gemFileDestination) {
      await move(gemFileSource, gemFileDestination);
    }

    gemFile = path.join(gemFileDir.trim(), gemFile);
  }

  return { gemFile };
};
