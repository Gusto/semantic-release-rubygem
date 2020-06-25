const path = require('path');
const SemanticReleaseError = require('@semantic-release/error');
const verifyConditions = require('../verifyConditions');

const defaultEnv = { GEM_HOST_API_KEY: '123' };

it('finds and loads the gemspec', async () => {
  const cwd = path.resolve(__dirname, './fixtures/valid');
  const { gemName, gemspec } = await verifyConditions({}, { cwd, env: defaultEnv });
  expect(gemName).toEqual('a-test-gem');
  expect(gemspec).toEqual('test-gem.gemspec');
});

describe('when there is no gemfile', () => {
  it('throws an error', async () => {
    await expect(verifyConditions({}, { cwd: process.cwd(), env: defaultEnv })).rejects.toThrow(
      new SemanticReleaseError("Couldn't find a `.gemspec` file."),
    );
  });
});

describe('when the gemspec is invalid', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/invalid-gemspec');
    await expect(verifyConditions({}, { cwd, env: defaultEnv })).rejects.toThrow(
      'Error loading `test-gem.gemspec`',
    );
  });
});

describe('when the gemspec has no name defined', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/no-gem-name');
    await expect(verifyConditions({}, { cwd, env: defaultEnv })).rejects.toThrow(
      'Missing `name` attribute in `test-gem.gemspec`',
    );
  });
});

it('finds the version file', async () => {
  const cwd = path.resolve(__dirname, './fixtures/valid');
  const { versionFile } = await verifyConditions({}, { cwd, env: defaultEnv });
  expect(versionFile).toEqual('lib/test-gem/version.rb');
});

describe('when there is no version file', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/no-version-file');
    await expect(verifyConditions({}, { cwd, env: defaultEnv })).rejects.toThrow(
      /^Couldn't find a `version.lib` file.$/,
    );
  });
});

describe('when the API key env var is not defined', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/valid');
    await expect(verifyConditions({}, { cwd, env: {} })).rejects.toThrow(
      /^No gem API key specified.$/,
    );
  });
});
