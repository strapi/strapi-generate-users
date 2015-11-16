'use strict';

/**
 * Prevent user `roles` update for security reasons.
 *
 * @param next
 */

exports.userAddOrRemoveRole = function * (next) {
  let isAuthorized = false;

  if (this.params.relation !== 'roles') {
    isAuthorized = true;
  } else if (this.user && this.user.id) {
    // Find the user.
    const user = yield strapi.orm.collections.user.findOne(this.user.id).populate('roles');

    // Check if the user has the `role` admin.
    const isAdmin = user && _.find(user.roles, {name: 'admin'});

    // Authorize the user only if the user has the admin `role`.
    if (isAdmin) {
      isAuthorized = true;
    }
  }

  if (isAuthorized) {
    // User is authorized to process this action.
    yield next;
  } else {
    // Forbidden.
    this.status = 403;
    this.body = {
      message: 'You must have the role `admin` to update roles using this route.'
    };
  }
};
