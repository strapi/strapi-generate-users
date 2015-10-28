'use strict';

/**
 * Module dependencies
 */

// Public node modules
const _ = require('lodash');

/**
 * Authorization service
 */

module.exports = {

  /**
   * Check is the user has the roles needed for
   * the current route.
   *
   * @param route
   * @param user
   *
   * @return {boolean}
   */

  isUserAuthorized: function * (route, user, ctx) {

    // Set to false by default.
    let isAuthorized = false;
    let entry;

    // Format data.
    user = user || {};
    user.roles = user.roles || [];

    // Map the list of roles.
    const authorizedRoles = _.isArray(route.roles) ? _.map(route.roles, 'name') : [];

    // Registered
    if (user.id && route.registeredAuthorized === true) {
      return isAuthorized = true;
    }

    // Owner policy.
    if (ctx.request.route.controller && route.contributorsAuthorized === true) {
      entry = yield strapi.orm.collections[ctx.request.route.controller].findOne(ctx.params.id).populate('contributors');

      if (entry && entry.contributors && ctx.user && ctx.user.id) {
        // The authenticated user is a contributor.
        return isAuthorized = _.find(entry.contributors, {id: ctx.user.id});
      } else {
        return isAuthorized = false;
      }
    }

    for (let i = 0; i < user.roles.length; i++) {
      const userRole = user.roles[i].name;
      if (userRole && _.contains(authorizedRoles, userRole)) {
        isAuthorized = true;
        break;
      }
    }

    return isAuthorized;
  }
};
