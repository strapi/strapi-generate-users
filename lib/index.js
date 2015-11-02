'use strict';

/**
 * Module dependencies
 */

// Local dependencies.
const settingsJSON = require('../json/settings.json.js');

/**
 * Generate the default user features
 */

module.exports = {
  before: require('./before'),
  targets: {
    'api/user/config/environments/development/settings.json': {
      jsonfile: settingsJSON
    },
    'api/user/config/environments/production/settings.json': {
      jsonfile: settingsJSON
    }
  }
};
