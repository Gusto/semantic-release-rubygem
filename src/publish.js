const { unlink } = require('fs').promises;
const execa = require('execa');

module.exports = async function publish({ gemFile }, { cwd, env }) {
  await execa('gem', ['push', gemFile], { cwd, env });
  await unlink(gemFile);
};
