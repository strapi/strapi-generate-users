'use strict';

exports.addDataUpdate = function * (next) {
  // Set the `updatedBy` field.
  this.request.body.updatedBy = this.user && this.user.id;

  yield next;
};
