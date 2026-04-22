import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import { move } from 'fs-extra';
import { VERSION_REGEX } from './common.js';

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
  const [bin, ...args] = command.trim().split(/\s+/);
  const installResult = execa(bin, args, { cwd, env });
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

export default async function prepare(
  { updateGemfileLock = false, gemFileDir = false },
  { nextRelease: { version }, cwd, env, logger, stdout, stderr },
  { versionFile, gemspec, gemName },
) {
  const { gemVersion } = await writeVersion({ versionFile, nextVersion: version, logger, cwd });

  if (updateGemfileLock) {
    await bundleInstall({ updateGemfileLock, cwd, env, logger, stdout, stderr });
  }

  let gemFile = await buildGem({
    gemspec,
    gemName,
    version: gemVersion,
    cwd,
    env,
    logger,
    stdout,
    stderr,
  });

  if (gemFileDir) {
    const gemFileSource = path.resolve(cwd, gemFile);
    const gemFileDestination = path.resolve(cwd, gemFileDir.trim(), gemFile);

    // Only move the gem file if we need to
    if (gemFileSource !== gemFileDestination) {
      await move(gemFileSource, gemFileDestination);
    }

    gemFile = path.join(gemFileDir.trim(), gemFile);
  }

  return { gemFile };
}
