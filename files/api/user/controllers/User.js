'use strict';

/**
 * A set of functions called "actions" for `user`
 */

module.exports = {

  /**
   * Kind of router to get user entry/entries
   *
   * @param {Object} this.request
   *
   * @return {Object|Array}
   */

  read: function * () {
    const params = this.params;
    let controller = 'user';

    if (params.hasOwnProperty('template') && strapi.controllers[controller + params.template]) {
      controller += params.template;
    }

    this.body = yield strapi.controllers[controller].get(params, this);
  },

  /**
   * Kind of router to update user entry
   *
   * @param {Object} this.request
   *
   * @return {Object}
   */

  update: function * () {
    const params = _.merge(this.request.body, this.params);
    let controller = 'user';

    if (params.hasOwnProperty('template') && strapi.controllers[controller + params.template]) {
      controller += params.template;
    }

    this.body = yield strapi.controllers[controller].edit(params, this);
  },

  /**
   * Kind of router to delete user entry
   *
   * @param {Object} this.request
   *
   * @return {Object}
   */

  delete: function * () {
    const params = _.merge(this.request.body, this.params);
    let controller = 'user';

    if (params.hasOwnProperty('template') && strapi.controllers[controller + params.template]) {
      controller += params.template;
    }

    this.body = yield strapi.controllers[controller].destroy(params, this);
  },

  /**
   * Get user entry if `id` is specified
   * or get entries with automatic pagination
   *
   * @param {Object} scope
   * @param {Context} _ctx
   *
   * @return {Promise*Object || Promise*Array}
   */

  get: function * (scope, _ctx) {
    const deferred = Promise.defer();

    if (!scope) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t read undefined record'
      });
    }

    User.find(scope)
      .exec(function (err, user) {
        if (err) {
          if (_ctx) {
            _ctx.status = 400;
          }

          deferred.resolve({
            error: err
          });
        }

        deferred.resolve((scope && scope.id) ? user[0] : user);
      });

    return deferred.promise;
  },

  /**
   * Edit user entry
   *
   * @param {Object} scope
   * @param {Context} _ctx
   *
   * @return {Promise*Object}
   */

  edit: function * (scope, _ctx) {
    const deferred = Promise.defer();

    if (!scope || !scope.id) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t update undefined record'
      });
    }

    User.update(scope.id, scope)
      .exec(function (err, user) {
        if (err) {
          if (_ctx) {
            _ctx.status = 400;
          }

          deferred.resolve({
            error: err
          });
        }

        deferred.resolve(user);
      });

    return deferred.promise;
  },

  /**
   * Destroy user entry
   *
   * @param {Object} scope
   * @param {Context} _ctx
   *
   * @return {Promise*Object}
   */

  destroy: function * (scope, _ctx) {
    const deferred = Promise.defer();

    if (!scope || !scope.id) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t delete undefined record'
      });
    }

    User.destroy(scope.id)
      .exec(function (err, user) {
        if (err) {
          if (_ctx) {
            _ctx.status = 400;
          }

          deferred.resolve({
            error: err
          });
        }

        deferred.resolve(user);
      });

    return deferred.promise;
  }

};
