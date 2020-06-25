const { unlink } = require('fs').promises;
const execa = require('execa');

module.exports = async function publish(
  { gemFile, gemName, gemHost },
  { cwd, env, logger, nextRelease: { version }, stdout, stderr },
) {
  logger.log(`Publishing version ${version} to gem server`);
  const args = ['push', gemFile];
  if (gemHost) {
    args.push('--host', gemHost);
  }
  const pushResult = execa('gem', ['push', gemFile], { cwd, env });
  pushResult.stdout.pipe(stdout, { end: false });
  pushResult.stderr.pipe(stderr, { end: false });
  await pushResult;

  logger.log(`Published version ${version} of ${gemName} to gem server`);
  await unlink(gemFile);
};
