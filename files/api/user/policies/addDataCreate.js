'use strict';

exports.addDataCreate = function * (next) {
  this.request.body.createdBy = this.user && this.user.id;
  this.request.body.updatedBy = this.user && this.user.id;
  this.request.body.contributors = this.request.body.contributors && this.request.body.contributors.length ? this.request.body.contributors : [this.user];

  yield next;
};
