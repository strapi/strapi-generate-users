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
    var params = this.params;
    var controller = 'user';

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
    var params = _.merge(this.request.body, this.params);
    var controller = 'user';

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
    var params = _.merge(this.request.body, this.params);
    var controller = 'user';

    if (params.hasOwnProperty('template') && strapi.controllers[controller + params.template]) {
      controller += params.template;
    }

    this.body = yield strapi.controllers[controller].destroy(params, this);
  },

  /**
   * Create user entry
   *
   * @param {Object} scope
   * @param {Context} _ctx
   *
   * @return {Promise*Object}
   */

  add: function * (scope, _ctx) {
    var deferred = Promise.defer();

    if (!scope) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t add undefined record'
      });
    }

    User.create(scope)
      .exec(function(err, user) {
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
   * Get user entry if `id` is specified
   * or get entries with automatic pagination
   *
   * @param {Object} scope
   * @param {Context} _ctx
   *
   * @return {Promise*Object || Promise*Array}
   */

  get: function * (scope, _ctx) {
    var deferred = Promise.defer();

    if (!scope) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: "You can't read undefined record"
      });
    }

    User.find(scope)
      .exec(function(err, user) {
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
    var deferred = Promise.defer();

    if (!scope || !scope.id) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t update undefined record'
      });
    }

    User.update(scope.id, scope)
      .exec(function(err, user) {
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
    var deferred = Promise.defer();

    if (!scope || !scope.id) {
      if (_ctx) {
        _ctx.status = 400;
      }

      deferred.resolve({
        error: 'You can\'t delete undefined record'
      });
    }

    User.destroy(scope.id)
      .exec(function(err, user) {
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
   * Forgot password - replace user password
   *
   * @return {Object|Boolean}
   */

  changePassword: function * () {
    // Init variables.
    let params = _.assign({}, this.request.body, this.params);
    let passport;

    if (params.password && params.password && params.password === params.passwordConfirmation && params.code) {

      try {
        passport = yield Passport.findOne({
          code: params.code,
          protocol: 'local'
        }).populate('user');
        if (!passport) {
          this.status = 400;
          return this.body = {
            status: 'error',
            message: 'Incorrect code provided.'
          };
        }

        try {

          // Delete the current code
          passport.code = null;

          // Set the new password (automatically crypted in the `beforeUpdate` function).
          passport.password = params.password;

          // Save the password
          yield passport.save();

          if (passport.user) {
            // Issue a new token
            let token = strapi.api.user.services.jwt.issue(passport.user);

            // Send the response
            this.body = {
              user: passport.user,
              jwt: token
            };
          } else {
            this.status = 400;
            this.body = {
              message: 'User not found.'
            }
          }
        } catch (err) {
          this.status = 400;
          this.body = err;
        }
      } catch (err) {
        this.status = 400;
        this.body = err;
      }

    } else if (params.password && params.password !== params.passwordConfirmation) {
      this.status = 400;
      return this.body = {
        status: 'error',
        message: 'Password not matching.'
      };
    } else {
      this.status = 400;
      return this.body = {
        status: 'error',
        message: 'Incorrect code provided.'
      };
    }

  }
};
