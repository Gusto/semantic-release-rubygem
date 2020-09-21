const path = require('path');
const tempy = require('tempy');
const { readFile } = require('fs').promises;
const SemanticReleaseError = require('@semantic-release/error');
const verifyConditions = require('../verifyConditions');

const defaultEnv = { GEM_HOST_API_KEY: '123' };
const validCwd = path.resolve(__dirname, './fixtures/nested');
let credentialsFile;

beforeEach(() => {
  credentialsFile = tempy.file();
});

it('finds and loads the gemspec', async () => {
  const { gemName, gemspec } = await verifyConditions(
    { pkgRoot: 'valid' },
    { cwd: validCwd, env: defaultEnv },
    { credentialsFile },
  );
  expect(gemName).toEqual('a-test-gem');
  expect(gemspec).toEqual('test-gem.gemspec');
});

describe('when there is no gemfile', () => {
  it('throws an error', async () => {
    await expect(
      verifyConditions({}, { cwd: process.cwd(), env: defaultEnv }, { credentialsFile }),
    ).rejects.toThrow(new SemanticReleaseError("Couldn't find a `.gemspec` file."));
  });
});

describe('when the gemspec is invalid', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/invalid-gemspec');
    await expect(
      verifyConditions({}, { cwd, env: defaultEnv }, { credentialsFile }),
    ).rejects.toThrow('Error loading `test-gem.gemspec`');
  });
});

describe('when the gemspec has no name defined', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/no-gem-name');
    await expect(
      verifyConditions({}, { cwd, env: defaultEnv }, { credentialsFile }),
    ).rejects.toThrow('Missing `name` attribute in `test-gem.gemspec`');
  });
});

it('verifies the version file', async () => {
  const { versionFile } = await verifyConditions(
    { pkgRoot: 'valid' },
    { cwd: validCwd, env: defaultEnv },
    { credentialsFile },
  );
  expect(versionFile).toEqual('lib/test-gem/version.rb');
});

describe('when the existing version file contains a prerelease version', () => {
  it('verifies the version file', async () => {
    const cwd = path.resolve(__dirname, './fixtures/nested');
    const { versionFile } = await verifyConditions(
      { pkgRoot: 'prerelease' },
      { cwd, env: defaultEnv },
      { credentialsFile },
    );
    expect(versionFile).toEqual('lib/test-gem/version.rb');
  });
});

describe('when there is no version file', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/nested');
    await expect(
      verifyConditions(
        { pkgRoot: 'no-version-file' },
        { cwd, env: defaultEnv },
        { credentialsFile },
      ),
    ).rejects.toThrow(/^Couldn't find a `version.lib` file.$/);
  });
});

describe('when no version can be found in the version file', () => {
  it('throws an error', async () => {
    const cwd = path.resolve(__dirname, './fixtures/nested');
    await expect(
      verifyConditions(
        { pkgRoot: 'invalid-version-file' },
        { cwd, env: defaultEnv },
        { credentialsFile },
      ),
    ).rejects.toThrow(
      /^Couldn't find a valid version constant defined in `lib\/test-gem\/version.rb`.$/,
    );
  });
});

it('creates the credentials file', async () => {
  await verifyConditions(
    { pkgRoot: 'valid' },
    { cwd: validCwd, env: defaultEnv },
    { credentialsFile },
  );
  const credentialsContents = await readFile(credentialsFile, 'utf8');
  expect(credentialsContents).toEqual('---\n:rubygems_api_key: 123');
});

describe('when the API key env var is not defined', () => {
  it('throws an error', async () => {
    await expect(
      verifyConditions({ pkgRoot: 'valid' }, { cwd: validCwd, env: {} }, { credentialsFile }),
    ).rejects.toThrow(/^No gem API key specified.$/);
  });
});
