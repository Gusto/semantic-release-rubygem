const path = require('path');
const { promisify } = require('util');
const rimrafOrig = require('rimraf');
const ncpModule = require('ncp');
const { readFile, writeFile, access } = require('fs').promises;
const execa = require('execa');
const { WritableStreamBuffer } = require('stream-buffers');
const prepare = require('../prepare');

const rimraf = promisify(rimrafOrig);
const ncp = promisify(ncpModule.ncp);

const cwd = path.resolve(__dirname, './fixtures/temp');
const versionFile = 'lib/test-gem/version.rb';
const gemspec = 'test-gem.gemspec';
const gemName = 'a-test-gem';
const context = {
  nextRelease: { version: '1.2.0' },
  cwd,
  logger: { log: () => {} },
  stdout: new WritableStreamBuffer(),
  stderr: new WritableStreamBuffer(),
};

const cleanUp = () => rimraf(cwd);

beforeEach(async () => {
  await cleanUp();
  await ncp(path.resolve(__dirname, './fixtures/valid'), cwd);
});

afterEach(async () => {
  await cleanUp();
});

it('writes the new version to the version.rb file', async () => {
  await prepare({}, context, { versionFile, gemspec, gemName });
  const versionContents = await readFile(path.resolve(cwd, versionFile), 'utf8');
  expect(versionContents).toEqual(`# frozen_string_literal: true

module TestGem
  VERSION = '1.2.0'
end
`);
});

describe('when the version.rb contains a prerelease version', () => {
  it('writes the new version to the version.rb file', async () => {
    await prepare(
      {},
      { ...context, nextRelease: { version: '1.0.0-alpha.1' } },
      { versionFile, gemspec, gemName },
    );
    const versionContents = await readFile(path.resolve(cwd, versionFile), 'utf8');
    expect(versionContents).toEqual(`# frozen_string_literal: true

module TestGem
  VERSION = '1.0.0-alpha.1'
end
`);
  });
});

describe('when updateGemfileLock is set to `true`', () => {
  it('runs `bundle install`', async () => {
    await writeFile(path.resolve(cwd, 'Gemfile'), "source 'https://rubygems.org'\ngemspec", 'utf8');
    await prepare({ updateGemfileLock: true }, context, { versionFile, gemspec, gemName });
    const { stdout: packageDef } = await execa(
      'bundle',
      [
        'exec',
        'ruby',
        '-e',
        'puts Bundler::LockfileParser.new(Bundler.read_file(Bundler.default_lockfile)).specs.first',
      ],
      { cwd },
    );
    expect(packageDef).toEqual('a-test-gem (1.2.0)');
  });
});

describe('when updateGemfileLock is set to a string', () => {
  it('runs the provided command', async () => {
    await writeFile(path.resolve(cwd, 'Gemfile'), "source 'https://rubygems.org'\ngemspec", 'utf8');
    await prepare({ updateGemfileLock: 'touch command_run' }, context, {
      versionFile,
      gemspec,
      gemName,
    });
    await expect(access(path.resolve(cwd, 'command_run'))).resolves.toBeUndefined();
  });
});

it('builds the gem', async () => {
  const { gemFile } = await prepare({}, context, { versionFile, gemspec, gemName });

  expect(gemFile).toEqual('a-test-gem-1.2.0.gem');
  await expect(access(path.resolve(cwd, gemFile))).resolves.toBeUndefined();
});
