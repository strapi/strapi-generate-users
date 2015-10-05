'use strict';

/**
 * Role policy
 */

exports.isAuthorized = function * (next) {
  // Init variables.
  let user;
  let userId;
  let route;

  // Get and verify JWT via service.
  try {
    // User is authenticated.
    user = yield strapi.api.user.services.jwt.getToken(this, true);

    // Store user id to request object.
    this.user = yield User.findOne(user.id).populate('roles');

    // We delete the token from query and body to not mess.
    this.request.query && delete this.request.query.token;
    this.request.body && delete this.request.body.token;
  } catch (err) {
  }

  // The user object is in the context thanks to
  // the `authenticated` policy.
  userId = this.user && this.user.id;

  // User is admin.
  if (this.user && this.user.roles && _.find(this.user.roles, {name: 'admin'})) {
    return yield next;
  }

  // Find the current route and its authorized roles.
  route = yield strapi.orm.collections.route.findOne({
    name: this.request.route.endpoint
  }).populate('roles');

  // Route not found.
  if (!route) {
    this.status = 404;
    return this.body = {
      message: 'Route not found'
    }
  }

  // Check if this route is public.
  if (_.find(route.roles, {name: 'public'})) {
    return yield next;
  }

  // Find the current user with its related roles.
  if (userId) {
    user = yield User.findOne(userId).populate('roles');
  }

  // Final check.
  if (yield strapi.api.user.services.user.isUserAuthorized(route, user, this)) {
    yield next;
  } else {
    this.status = 401;
    this.body = {
      message: 'You are not allowed to perform this action.'
    };
  }
};
