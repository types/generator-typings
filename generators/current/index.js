'use strict';
const path = require('path');
const yeoman = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const changeCase = require('change-case');

module.exports = yeoman.Base.extend({
  prompting: {
    greeting() {
      this.log(yosay(`Welcome to the sensational ${chalk.yellow('typings')} generator!`));
    },
    sourceUri() {
      const uriExamples = [
        'visionmedia/batch',
        'chaijs/chai',
        'ded/domready',
        'knockout/knockout'
      ];

      return this.prompt({
        type: 'input',
        name: 'sourceUri',
        message: `What is the ${chalk.green('author/module')} of the ${chalk.red('source')} on github?`,
        default: () => uriExamples[Math.round(Math.random() * 4 - 0.5)],
        validate: (value) => value.length > 0
      }).then((props) => {
        this.sourceUri = props.sourceUri;
        this.sourcePackageUrl = `https://github.com/${props.sourceUri}`;
        this.sourcePackageName = props.sourceUri.split('/')[1];
        this.prettyPackageName = changeCase.titleCase(this.sourcePackageName.replace('-', ' '));
        this.packageVariable = changeCase.camelCase(this.sourcePackageName.replace('-', ' '));
      });
    },
    isNpm() {
      return this.prompt({
        type: 'confirm',
        name: 'isNpm',
        message: `Is the source installable through NPM?`,
        default: true
      }).then((props) => {
        this.isNpm = props.isNpm;
      });
    },
    npmName() {
      return this.prompt({
        type: 'input',
        name: 'npmName',
        message: `Name of the package on NPM is...`,
        when: () => this.isNpm,
        default: () => this.sourcePackageName
      }).then((props) => {
        this.npmName = props.npmName;
      });
    },
    isAmbient() {
      return this.prompt({
        type: 'confirm',
        name: 'isAmbient',
        message: `Is this module ambient? i.e. does it declare itself globally?`,
        default: false
      }).then((props) => {
        this.isAmbient = props.isAmbient;
      });
    },
    username() {
      return this.prompt({
        type: 'input',
        name: 'username',
        message: 'And your GitHub username is...',
        validate: (value) => value.length > 0,
        store: true
      }).then((props) => {
        this.username = props.username;
      });
    },
    license() {
      const licenses = [
        { name: 'Apache 2.0', value: 'Apache-2.0' },
        { name: 'MIT', value: 'MIT' },
        { name: 'Unlicense', value: 'unlicense' },
        { name: 'FreeBSD', value: 'BSD-2-Clause-FreeBSD' },
        { name: 'NewBSD', value: 'BSD-3-Clause' },
        { name: 'Internet Systems Consortium (ISC)', value: 'ISC' },
        { name: 'No License (Copyrighted)', value: 'nolicense' }
      ];

      return this.prompt({
        type: 'list',
        name: 'license',
        message: 'Which license do you want to use?',
        default: 'MIT',
        choices: licenses
      }).then((props) => {
        this.license = props.license;
      });
    },
    nameOnLicense() {
      return this.prompt({
        type: 'input',
        name: 'name',
        message: 'Name to use on the license?',
        default: this.username
      }).then((props) => {
        this.nameOnLicense = props.name;
      });
    }
  },

  writing: {
    copyFiles() {
      this.fs.copy(
        this.templatePath('.vscode/*'),
        this.destinationPath('.vscode')
      );
      this.fs.copy(
        this.templatePath('test/*'),
        this.destinationPath('test')
      );
      this.fs.copy(
        this.templatePath('source-test/*'),
        this.destinationPath('source-test')
      );
      this.fs.copy(
        this.templatePath('*'),
        this.destinationPath()
      );
      this.fs.copy(
        this.templatePath('.*'),
        this.destinationPath()
      );
      this.fs.copy(
        this.templatePath('template/_.gitignore'),
        this.destinationPath('.gitignore')
      );
    },
    createTypings() {
      this.fs.copyTpl(
        this.templatePath('template/typings.json'),
        this.destinationPath('typings.json'),
        {
          name: this.npmName || this.sourcePackageName,
          main: 'index.d.ts',
          homepage: `https://github.com/${this.sourceUri}`,
          version: ''
        });
    },
    createREADME() {
      this.fs.copyTpl(
        this.templatePath('template/README.md'),
        this.destinationPath('README.md'),
        {
          prettyPackageName: this.prettyPackageName,
          sourcePackageName: this.npmName || this.sourcePackageName,
          sourcePackageUrl: this.sourcePackageUrl,
          license: this.license
        });
    },
    createTestFile() {
      this.fs.write('test/test.ts',
        [
          'import test = require(\'blue-tape\');',
          '',
          this.isAmbient ? '' : `import ${this.packageVariable} = require('${this.npmName || this.sourcePackageName}');`,
          ''
        ].join('\n'));
    },
    updatePackageJson() {
      this.fs.copyTpl(
        this.templatePath('template/package.json'),
        this.destinationPath('package.json'),
        {
          ambient: this.isAmbient ? ' --ambient' : '',
          sourceTest: 'echo source-test is not specified'
        });
    },
    createLICENSE() {
      const filename = `template/${this.license}.txt`;
      const author = this.nameOnLicense.trim();

      this.fs.copyTpl(
        this.templatePath(filename),
        this.destinationPath('LICENSE'),
        {
          year: (new Date()).getFullYear(),
          author: author
        }
      );
    }
  },
  install: {
    npmInstallSource() {
      if (this.npmName) {
        this.log(`Installing ${chalk.green(this.npmName)}...`);
        this.spawnCommandSync('npm', ['install', '-D', '--save-exact', this.npmName]);
      }
    },
    submodule() {
      this.log(`Downloading ${chalk.green(this.sourceUri)}...`);
      // Currently this step is needed to pass test. Will use nodegit for this.
      this.spawnCommandSync('git', ['init']);
      this.spawnCommandSync('git', ['submodule', 'add', `${this.sourcePackageUrl}`, 'source']);
    }
  },
  end: {
    isReady() {
      this.log('');
      this.log('I am done! Now it is your turn!');
    },
    installSource() {
      if (!this.isNpm) {
        this.log('');
        this.log('You need to install the source package and reference it for the test to work.');
      }
    },
    tsdHint() {
      this.log('');
      this.log('If DefinitelyTyped has a definition for the source,');
      this.log(` you can run ${chalk.green('tsd install <source>')} to download the file`);
      this.log(' so you can easily access those definitions.');
      this.log('You don\'t need to save it though.');
    },
    readyToTest() {
      this.log('');
      this.log(`Run ${chalk.green('npm install')} to install dependencies needed. It will take about a minute.`);
      this.log('In the meantime, you can open your editor and start writing.');
      this.log('');
      this.log(`When installation completes, run ${chalk.green('npm run watch')}.`);
      this.log('It will automatically build and test the typings for you as you make changes.');
    }
  }
});
