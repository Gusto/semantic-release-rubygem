const { unlink } = require('fs').promises;
const execa = require('execa');

module.exports = async function publish(
  { gemHost },
  { cwd, env, logger, nextRelease: { version }, stdout, stderr },
  { gemFile, gemName, credentialsFile },
) {
  logger.log(`Publishing version ${version} to gem server`);
  const args = ['push', gemFile];
  if (gemHost) {
    args.push('--host', gemHost);
  }
  const pushResult = execa('gem', ['push', gemFile, '--config-file', credentialsFile], {
    cwd,
    env,
  });
  pushResult.stdout.pipe(stdout, { end: false });
  pushResult.stderr.pipe(stderr, { end: false });
  await pushResult;

  logger.log(`Published version ${version} of ${gemName} to gem server`);
  await unlink(gemFile);
};
