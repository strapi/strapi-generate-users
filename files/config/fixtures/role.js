'use strict';

/**
 * Creates default Roles
 *
 */
exports.create = function () {
  return Promise.all([
    strapi.orm.collections.role.findOrCreate({name: 'admin'}, {name: 'admin'}),
    strapi.orm.collections.role.findOrCreate({name: 'contributor'}, {name: 'contributor'}),
    strapi.orm.collections.role.findOrCreate({name: 'registered'}, {name: 'registered'})
  ]);
};
