'use strict';

/**
 * Module dependencies
 */

// Public node modules
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const pluralize = require('pluralize');

/**
 * Authorization service
 */

module.exports = {

  /**
   * Helper used to hash the password of a `user`.
   *
   * @param {Object}   user
   * @param {Function} next
   */

  hashPassword: function (user, next) {
    if (!user.hasOwnProperty('password') || !user.password || this.isHashed(user.password)) {
      next(null, user);
    } else {
      bcrypt.hash(user.password, 10, function (err, hash) {
        user.password = hash;
        next(err, user);
      });
    }
  },

  /**
   * Check if the password is already a hash.
   *
   * @param   {String}    password
   * @returns {boolean}
   */

  isHashed: function (password) {
    if (typeof password !== 'string' || !password) {
      return false;
    }
    return password.split('$').length === 4;
  },

  /**
   * Check is the user has the roles needed for
   * the current route.
   *
   * @param _ctx
   *
   * @return {boolean}
   */

  isUserAuthorized: function * (_ctx) {

    // Init variables;
    let user;
    let route;

    // Get and verify JWT via service.
    try {
      // User is authenticated.
      user = yield strapi.api.user.services.jwt.getToken(_ctx, true);

      // Store user id to request object.
      _ctx.user = yield User.findOne(user.id).populate('roles');

      // We delete the token from query and body to not mess.
      _ctx.request.query && delete _ctx.request.query.token;
      _ctx.request.body && delete _ctx.request.body.token;
    } catch (err) {
    }

    // User is admin.
    if (_ctx.user && _ctx.user.roles && _.find(_ctx.user.roles, {name: 'admin'})) {
      return true;
    }

    // Find the current route and its authorized roles.
    route = yield strapi.orm.collections.route.findOne({
      name: _.trim(_ctx.request.route.endpoint)
    }).populate('roles');

    // Route not found.
    if (!route) {
      throw Error('Route not found');
    }

    // Check if _ctx route is public.
    if (route.isPublic === true) {
      return true;
    }

    // The user is not connected.
    if (!_ctx.user) {
      return false;
    }

    // Registered.
    if (user.id && route.registeredAuthorized === true && !route.contributorsAuthorized) {
      return true;
    }

    // Map the list of roles.
    const authorizedRoles = _.isArray(route.roles) ? _.map(route.roles, 'name') : [];

    let entry;
    // Owner policy.
    if (_ctx.request.route.controller && route.contributorsAuthorized === true) {
      const controller = _ctx.request.route.controller && _ctx.request.route.controller.toLowerCase();
      if (_ctx.params.id) {
        // Specific behavior if the model requested is `user`.
        if (_ctx.request.route.controller.toLowerCase() === 'user') {
          // Attempting to find a user.
          const userFound = yield strapi.orm.collections.user.findOne(_ctx.params.id);

          // Check if the user found has the same `id that the authenticated user.
          return userFound && userFound.id === user.id;
        } else {
          entry = yield strapi.orm.collections[controller].findOne(_ctx.params.id).populate('contributors');

          if (entry && entry.contributors && _ctx.user && _ctx.user.id) {
            // The authenticated `user` is a contributor.
            return _.find(entry.contributors, {id: _ctx.user.id});
          } else {
            // Default behavior.
            return false;
          }
        }
      } else if (_ctx.request.route.verb && _ctx.request.route.verb.toLowerCase() === 'get') {
        // Specific behavior if the model requested is `user`.
        if (_ctx.request.route.controller.toLowerCase() === 'user') {
          // Set the default `where` object.
          _ctx.request.query.where = _ctx.request.query.where || {};
          _ctx.request.query.where.id = [user.id];
        } else {
          // Pluralize the controller name in order to have the relation name.
          const relation = pluralize.plural(route.controller).toLowerCase();

          // Format request for `GET` requests (eg. the user will receive only the items he is contributor to).
          yield formatGetRequest(user, relation, _ctx);
        }

        return true;
      } else {
        // Default behavior.
        return false;
      }
    }

    // Check by roles.
    // user.roles is an empty array, so switching to _ctx.user.roles
    let userRole;
    for (let i = 0; i < _ctx.user.roles.length; i++) {
      userRole = _ctx.user.roles[i].name;
      if (userRole && _.contains(authorizedRoles, userRole)) {
        return true;
      }
    }

    // Defaults to `false`.
    return false;
  }
};

/**
 * Format the `_ctx.request` object in order
 * to filter sent items.
 *
 * @param user
 * @param relation
 * @param _ctx
 */
function * formatGetRequest(user, relation, _ctx) {
  // Find the user and populate with the relation.
  const userFound = yield strapi.orm.collections.user.findOne({
    id: user && user.id
  }).populate(relation);

  // User not found.
  if (!userFound) {
    throw Error('User not found');
  }

  // Set the default `where` object.
  _ctx.request.query.where = _ctx.request.query.where || {};

  // The blueprints will filter the items by IDs.
  _ctx.request.query.where.id = _.map(userFound[relation], function (item) {
    return item.id;
  });
}
