'use strict';

/**
 * Module dependencies
 */

// Local dependencies.
const settingsDevelopmentJSON = require('../json/development/settings.json.js');
const settingsProductionJSON = require('../json/production/settings.json.js');

/**
 * Generate the default user features
 */

module.exports = {
  before: require('./before'),
  targets: {
    'api/user/config/environments/development/settings.json': {
      jsonfile: settingsDevelopmentJSON
    },
    'api/user/config/environments/production/settings.json': {
      jsonfile: settingsProductionJSON
    }
  }
};
