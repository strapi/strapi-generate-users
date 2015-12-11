'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets lifted.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports.bootstrap = function (cb) {
  const fixtures = require('../../api/user/config/fixtures/index');

  fixtures.role.create()
    .then(function () {
      return fixtures.route.create();
    })
    .then(function () {
      cb();
    })
    .catch(function (err) {
      strapi.log.error(err);
      cb(err);
    });
};
