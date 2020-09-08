# semantic-release-rubygem

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin for publishing Ruby [gems](https://rubygems.org/).

| Step               | Description                                                                                                                                   |                                                                     |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| `verifyConditions` | Locate and validate a `.gemspec` file, locate and validate a `lib/**/version.rb` file, verify the presence of the `GEM_HOST_API_KEY` environment variable, and create a credentials file with the API key.|                                                                     |
| `prepare`          | Update the version in the `lib/**/version.rb` version file and [build](https://guides.rubygems.org/command-reference/#gem-build) the gem.                                      |                                                                     |
| `publish`          | [Push the gem](https://guides.rubygems.org/command-reference/#gem-push) to the gem server.                                                                |                                                                     |

## Install

```bash
$ npm install semantic-release-rubygem -D
```

## Usage

Add the plugin to the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-rubygem",
  ]
}
```

## Configuration

### Gem server authentication

The gem server authentication configuration is **required**.

The API key must be set using the `GEM_HOST_API_KEY` environment variable. To retrieve the key, you can:
1. Login to [RubyGems.org](https://rubygems.org) and click on ['Edit Profile'](https://rubygems.org/profile/edit). You'll find the key in the 'API Access' section of the page.
2. Sign into your gem host using the [`gem signin`](https://guides.rubygems.org/command-reference/#gem-signin) command. After you enter your credentials, your API key will be stored as a YAML value in the `~/.gem/credentials` file under the `rubygems_api_key` key (or the hostname of your gem server).

### gemspec file

This plugin requires exactly one valid `.gemspec` file to be present in the CWD.

### `lib/**/version.rb` file

This plugin requires the version of the published gem to be defined in a `version.rb` file somewhere in the `lib` folder (e.g. `lib/my/gem/version.rb`). The version itself must be defined as a constant named `VERSION` inside the file:
```ruby
module My
  module Gem
    VERSION = '0.0.0'
  end
end

```

### Options

| Options      | Description                                                                                                         | Default                                                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `gemHost` | The gem server to push the gem to.  | `'https//rubygems.org'` |
| `updateGemfileLock` | Whether to update the version of the gem to publish in the `Gemfile.lock`. This is useful if you are using the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin to keep the version up to date in your git repo. When set to `true` the plugin will run `bundle install` to update the version. If another command is desired, it can be set by passing a string (e.g. `bundle appraisal install`). | `false` |
| `gemPublish` | Whether to publish your gem to the gem server. | `true` |
| `gemFileDir` | Directory path in which to write the the built `.gem` file. If `false`, the `.gem` file will not be kept on the file system. | `false` |
| `pkgRoot`    | Directory path to publish.	 | `.` | 

Note: The `pkgRoot` directory must contain a *.gemspec file.
