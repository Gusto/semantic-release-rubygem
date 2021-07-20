const { unlink } = require('fs').promises;
const execa = require('execa');

module.exports = async function publish(
  { gemHost, gemPublish = true, gemFileDir = false },
  { cwd, env, logger, nextRelease: { version }, stdout, stderr },
  { gemFile, gemName, credentialsFile },
) {
  if (gemPublish !== false) {
    logger.log(`Publishing version ${version} to gem server`);
    const args = ['push', gemFile, '--config-file', credentialsFile, '--key', 'api_key'];
    if (gemHost) {
      args.push('--host', gemHost);
    }
    const pushResult = execa('gem', args, { cwd, env });
    pushResult.stdout.pipe(stdout, { end: false });
    pushResult.stderr.pipe(stderr, { end: false });
    await pushResult;

    logger.log(`Published version ${version} of ${gemName} to gem server`);
  } else {
    logger.log(`Skip publishing to gem server because gemPublish is ${gemPublish !== false}`);
  }

  if (gemFileDir === false) {
    await unlink(gemFile);
  }
};
