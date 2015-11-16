'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');

exports.addDataCreate = function * (next) {
  // Set the `createdBy` and `updatedBy` fields.
  if (this.user && this.user.id) {
    this.request.body.createdBy = this.user.id;
    this.request.body.updatedBy = this.user.id;
  }

  // Set the value of the `contributors` list.
  this.request.body.contributors = _.isArray(this.request.body.contributors) ? this.request.body.contributors : [];
  if (!this.request.body.contributors.length && this.user) {
    // Add the current user as contributor.
    this.request.body.contributors.push(this.user);
  }

  yield next;
};
