// const verifyConditions = require('./src/verify');
const util = require('util');
const execa = require('execa');
const path = require('path');
const { writeFile } = require('fs').promises;
const SemanticReleaseError = require('@semantic-release/error');

const glob = util.promisify(require('glob'));

const loadGemspec = async cwd => {
  const gemspecs = await glob('*.gemspec', { cwd });
  // TODO: What if there are multiple gemspecs?
  if (gemspecs.length !== 1) {
    throw new SemanticReleaseError(
      "Couldn't find a `.gemspec` file.",
      'ENOGEMSPEC',
      `A single [.gemspec](https://guides.rubygems.org/specification-reference/) file in the root of your project is required to release a Ruby gem.

Please follow the "[Make your own gem guide](https://guides.rubygems.org/make-your-own-gem/)" to create a valid \`.gemspec\` file
      `,
    );
  }

  const [gemspec] = gemspecs;
  let gemName = null;
  try {
    // TODO: Use cwd here instead of the full path?
    const { stdout } = await execa(
      'ruby',
      ['-e', `puts Gem::Specification.load('${gemspec}').name`],
      { cwd },
    );
    gemName = stdout;
  } catch (error) {
    throw new SemanticReleaseError(
      `Error loading \`${gemspec}\``,
      'EINVALIDGEMSPEC',
      `A valid [.gemspec](https://guides.rubygems.org/specification-reference/) is required to release a Ruby gem.

Please follow the "[Make your own gem guide](https://guides.rubygems.org/make-your-own-gem/)" to create a valid \`.gemspec\` file
      `,
    );
  }

  if (gemName === '') {
    throw new SemanticReleaseError(
      `Missing \`name\` attribute in \`${gemspec}\``,
      'ENOGEMNAME',
      `The [name](https://guides.rubygems.org/specification-reference/#name) attribute is required in your \`.gemspec\` file in order to publish a Ruby gem.

Please make sure to add a valid \`name\` for your gem in your \`.gemspec\`.
      `,
    );
  }

  return { name: gemName, gemspec };
};

const findVersionFile = async cwd => {
  // TODO: Should we verify that we can find the version here?
  const versionFiles = await glob('lib/**/version.rb', { cwd });
  if (versionFiles.length !== 1) {
    throw new SemanticReleaseError(
      "Couldn't find a `version.lib` file.",
      'ENOVERSIONFILE',
      `A \`version.rb\` file in the \`lib/*\` dir of your project is required to release a Ruby gem.

Please create a \`version.rb\` file with a defined \`VERSION\` constant in your \`lib\` dir (or subdir).
      `,
    );
  }

  return versionFiles[0];
};

const verifyApiKey = async ({ env, cwd, credentialsFile }) => {
  // TODO: Handle credentials stored in ~/.gem/credentials
  if (!env.GEM_HOST_API_KEY) {
    throw new SemanticReleaseError(
      'No gem API key specified.',
      'ENOGEMAPIKEY',
      `A gem host API key must be created and set in the \`GEM_HOST_API_KEY\` environment variable on you CI environment.

You can retrieve an API key either from your \`~/.gem/credentials\` file or in your profile in [RubyGems.org](http://rubygems.org/).
      `,
    );
  }

  await writeFile(
    path.resolve(cwd, credentialsFile),
    // TODO: Handle other hosts
    `---\n:rubygems_api_key: ${env.GEM_HOST_API_KEY}`,
    'utf8',
  );
};

/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
module.exports = async function verify(pluginConfig, { env, cwd }, { credentialsFile }) {
  // - Verify ruby installed?

  // - Locate gemspec and determine name
  const { name, gemspec } = await loadGemspec(cwd);

  // - Locate version file
  const versionFile = await findVersionFile(cwd);

  // - Verify env var
  await verifyApiKey({ env, cwd, credentialsFile });

  return { gemName: name, gemspec, versionFile };
};
