const { unlink } = require('fs').promises;
const execa = require('execa');
const path = require('path');

module.exports = async function publish(
  { gemHost, gemPublish = true, gemFileDir = false, pkgRoot },
  { cwd, env, logger, nextRelease: { version }, stdout, stderr },
  { gemFile, gemName, credentialsFile },
) {
  const gemSpecPkgRoot = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;

  if (gemPublish !== false) {
    logger.log(`Publishing version ${version} to gem server`);
    const args = ['push', gemFile, '--config-file', credentialsFile];
    if (gemHost) {
      args.push('--host', gemHost);
    }
    const pushResult = execa('gem', args, { cwd: gemSpecPkgRoot, env });
    pushResult.stdout.pipe(stdout, { end: false });
    pushResult.stderr.pipe(stderr, { end: false });
    await pushResult;

    logger.log(`Published version ${version} of ${gemName} to gem server`);
  } else {
    logger.log(`Skip publishing to gem server because gemPublish is ${gemPublish !== false}`);
  }

  if (gemFileDir === false) {
    const gemFilePkgRoot = pkgRoot ? path.resolve(cwd, pkgRoot, gemFile) : gemFile;
    await unlink(gemFilePkgRoot);
  }
};
