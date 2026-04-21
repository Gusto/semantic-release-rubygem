# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
yarn install

# Run all tests
yarn test

# Run a single test file
yarn test src/__tests__/prepare.test.js

# Run tests matching a pattern
yarn test --testNamePattern="builds the gem"

# Lint
yarn lint
```

Tests require Ruby, `gem`, and `bundle` to be available in the environment since they invoke the actual Ruby toolchain.

## Architecture

This is a [semantic-release](https://github.com/semantic-release/semantic-release) plugin that publishes Ruby gems. It implements the three lifecycle steps semantic-release expects:

- **`verifyConditions`** (`src/verifyConditions.js`): Validates exactly one `.gemspec` exists in CWD, loads it via Ruby to get the gem name, finds exactly one `lib/**/version.rb` file and checks it defines a `VERSION` constant, and writes a gem credentials file from `GEM_HOST_API_KEY`.
- **`prepare`** (`src/prepare.js`): Updates the version constant in `version.rb` (converting semver pre-release separators from `-` to `.` for RubyGems compatibility), optionally runs `bundle install` to update `Gemfile.lock`, then runs `gem build` to produce a `.gem` file.
- **`publish`** (`src/publish.js`): Runs `gem push` with the credentials file. Deletes the `.gem` file afterward unless `gemFileDir` is set.

The entry point `index.js` wires these together, passing state (gem name, gemspec path, version file path, built gem file path, credentials file path) across lifecycle steps via closure variables.

**`src/common.js`** exports `VERSION_REGEX`, the regex used to match and replace the `VERSION = '...'` constant in `version.rb` files.

### Plugin options

| Option | Default | Description |
|--------|---------|-------------|
| `gemHost` | `https://rubygems.org` | Gem server URL |
| `updateGemfileLock` | `false` | `true` runs `bundle install`; a string runs that command instead |
| `gemPublish` | `true` | Set to `false` to skip pushing |
| `gemFileDir` | `false` | Directory to keep the built `.gem` file; `false` deletes it after publish |

### Tests

Tests live in `src/__tests__/` and use Jest. The `prepare.test.js` suite copies fixture files from `src/__tests__/fixtures/valid/` to a `fixtures/temp/` directory before each test and cleans up afterward. It exercises the real `gem build` and `bundle` commands, so Ruby must be available.

ESLint config extends `eslint-config-gusto`.
