'use strict';

/**
 * Module dependencies
 */

// Public node modules
const _ = require('lodash');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets lifted.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports.bootstrap = function (cb) {
  const passport = strapi.api.user.services.passport;
  const fixtures = require('../fixtures/index');

  passport.loadStrategies();

  fixtures.role
    .create()
    .then(function () {
      fixtures.route.create()
        .then(function () {
          cb();
        })
        .catch(function (err) {
          console.log(err);
        })
    })
    .catch(function (err) {
      console.log(err);
    });
};
