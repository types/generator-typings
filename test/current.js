'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('current', function() {
  describe('visionmedia/batch', function() {
    before(function(done) {
      this.timeout(60000);
      helpers.run(path.join(__dirname, '../generators/current'))
        .withPrompts({
          sourceUri: 'visionmedia/batch',
          // Set to false to avoid longer test time.
          isNpm: false,
          isAmbient: false,
          username: 'unional',
          license: 'MIT',
          name: 'unional'
        })
        .on('end', done);
    });

    it('creates files', function() {
      assert.file([
        '.vscode/settings.json',
        'source-test/README.md',
        'source-test/tsconfig.json',
        'test/test.ts',
        'test/tsconfig.json',
        '.editorconfig',
        '.gitignore',
        '.npmignore',
        'LICENSE',
        'index.d.ts',
        'README.md',
        'package.json',
        'typings.json',
        'tsconfig.json'
      ]);
    });
  });
});
