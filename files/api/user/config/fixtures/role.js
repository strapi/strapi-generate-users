'use strict';

/**
 * Creates default Roles
 */

exports.create = function () {
  return Promise.all([
    strapi.orm.collections.role.findOrCreate({
      name: 'admin'
    }, {
      name: 'admin'
    })
  ]);
};
