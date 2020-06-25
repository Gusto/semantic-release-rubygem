const path = require('path');
const SemanticReleaseError = require('@semantic-release/error');
const verifyConditions = require('../verifyConditions');

const defaultEnv = { GEM_HOST_API_KEY: '123' };

it('finds and loads the gemspec', async () => {
  const pluginConfig = {};
  const cwd = path.resolve(__dirname, './fixtures/valid');
  await verifyConditions(pluginConfig, { cwd, env: defaultEnv });
  expect(pluginConfig.gemName).toEqual('a-test-gem');
  expect(pluginConfig.gemspec).toMatch(/fixtures\/valid\/test-gem.gemspec$/);
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
      /Error loading .+\/fixtures\/invalid-gemspec\/test-gem.gemspec/,
    );
  });
});

describe('when the gemspec has no name defined', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/no-gem-name');
    await expect(verifyConditions({}, { cwd, env: defaultEnv })).rejects.toThrow(
      /Missing `name` attribute in .+\/fixtures\/no-gem-name\/test-gem.gemspec/,
    );
  });
});

it('finds the version file', async () => {
  const pluginConfig = {};
  const cwd = path.resolve(__dirname, './fixtures/valid');
  await verifyConditions(pluginConfig, { cwd, env: defaultEnv });
  expect(pluginConfig.versionFile).toMatch(/fixtures\/valid\/lib\/test-gem\/version.rb$/);
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
