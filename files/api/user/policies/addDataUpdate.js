'use strict';

exports.addDataUpdate = function * (next) {
  if (this.user && this.user.id) {
    this.request.body.updatedBy = this.user.id;

    yield next;
  } else {
    this.status = 401;
    return this.body = {
      message: 'You are not allowed to perform this action.'
    };
  }
};
