'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');
const crypto = require('crypto');

// Public node modules.
const _ = require('lodash');
const fs = require('fs-extra');

/**
 * This `before` function is run before generating targets.
 * Validate, configure defaults, get extra dependencies, etc.
 *
 * @param {Object} scope
 * @param {Function} cb
 */

module.exports = function (scope, cb) {

  // `scope.args` are the raw command line arguments.
  _.defaults(scope, {
    id: scope.args[0]
  });

  // Generate random codes.
  const jwtSecretDevelopment = crypto.randomBytes(32).toString('hex');
  const jwtSecretProduction = crypto.randomBytes(32).toString('hex');

  // Copy the user files.
  fs.copySync(path.resolve(__dirname, '..', 'files'), path.resolve(scope.rootPath));

  // Take another pass to take advantage of the defaults absorbed in previous passes.
  _.defaults(scope, {
    rootPath: scope.rootPath,
    humanizeId: scope.args[0],
    humanizedPath: '`./api/user`',
    jwtSecretDevelopment: jwtSecretDevelopment,
    jwtSecretProduction: jwtSecretProduction
  });

  // Trigger callback with no error to proceed.
  return cb.success();
};
