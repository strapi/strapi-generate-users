'use strict';

/**
 * Role policy
 */

exports.hasRole = function *(next) {

  // The user object is in the context thanks to
  // the `authenticated` policy
  const userId = this.user.id;

  // Check if the user is authenticated.
  if (!userId) {
    this.status = 401;
    return this.body = {
      message: 'You are not allowed to perform this action.'
    };
  }

  // User is admin.
  if (this.user && this.user.roles && _.find(this.user.roles, {name: 'admin'})) {
    return yield next;
  }

  // Find the current route and its authorized roles.
  const route = yield Route.findOne({
    name: this.request.endpoint
  }).populate('roles');

  // Route not found.
  if (!route) {
    this.status = 404;
    return this.body = {
      message: 'Route not found'
    };
  }

  // Check if this route is public.
  if (_.find(route.roles, {name: 'guest'})) {
    return yield next;
  }

  // Find the current user with its related roles.
  const user = yield User.findOne(userId).populate('roles');

  // User not found.
  if (!user) {
    this.status = 404;
    return this.body = {
      message: 'User not found'
    };
  }

  // Final check.
  if (strapi.api.user.services.user.isUserAuthorized(route, user)) {
    yield next;
  } else {
    this.status = 401;
    this.body = {
      message: 'You are not allowed to perform this action.'
    };
  }
};
