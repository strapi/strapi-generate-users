'use strict';

/**
 * Expose user settings.
 */

module.exports = function dataForSettingsJSON(scope) {

  return {
    'jwtSecret': scope.jwtSecretProduction
  };
};
