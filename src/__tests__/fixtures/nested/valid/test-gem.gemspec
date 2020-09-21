# frozen_string_literal: true

lib = File.expand_path('lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'test-gem/version'

Gem::Specification.new do |spec|
  spec.name          = 'a-test-gem'
  spec.version       = TestGem::VERSION
  spec.authors       = ['Rylan Collins']
  spec.summary       = 'A gem for testing'
end
