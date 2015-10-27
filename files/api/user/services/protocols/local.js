'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const anchor = require('anchor');

/**
 * Registration protocol
 */

exports.register = function * (ctx) {
  const params = _.assign(ctx.request.body, {
    id_ref: 1,
    lang: strapi.config.i18n.defaultLocale,
    template: 'standard'
  });

  // Init the Promise.
  const deferred = Promise.defer();

  // Password is required.
  if (!params.password) {
    reject('Invalid password field');
  }

  // First, check if the user is the first one to register.
  try {
    const usersCount = yield User.count();

    // Create the user
    let user = yield User.create(params);

    // Create a `local` passport
    try {
      yield Passport.create({
        protocol: 'local',
        password: params.password,
        user: user.id
      });
    } catch (err) {
      return user.destroy(function (destroyErr) {
        deferred.reject(destroyErr || 'Password to short min 8 caracters');
      });
    }

    // Find the created user and populate with hs `roles`
    user = yield User.findOne(user.id).populate('roles');

    // User not found
    if (!user) {
      return deferred.reject({
        message: 'User not found.'
      });
    }

    // Find the roles
    const roles = yield strapi.orm.collections.role.find();

    // Check if the user is the first to register
    if (!usersCount) {
      // Add the role `admin` to the current user
      user.roles.add(_.find(roles, {name: 'admin'}));

      // Save the user with its new role
      user.save(function (err) {
        if (err) {
          return deferred.reject(err);
        }
      });

      deferred.resolve(user);
    } else {
      deferred.resolve(user);
    }
  } catch (err) {
    deferred.reject(err);
  }

  return deferred.promise;
};

/**
 * Validate a login request
 *
 * Looks up a user using the supplied identifier (email or username) and then
 * attempts to find a local Passport associated with the user. If a Passport is
 * found, its password is checked against the password supplied in the form.
 *
 * @param {Object}   ctx
 * @param {String}   identifier
 * @param {String}   password
 * @param {Function} next
 */

exports.login = function (ctx, identifier, password, next) {
  let query = {};

  // Check if the provided identifier is an email or not.
  const isEmail = !anchor(identifier).to({
    type: 'email'
  });

  // Set the identifier to the appropriate query field.
  if (isEmail) {
    query.email = identifier;
  } else {
    query.username = identifier;
  }

  // The identifier is required.
  if (!identifier) {
    return next(new Error('Please provide your username or your e-mail.'));
  }

  // The password is required.
  if (!password) {
    return next(new Error('Please provide your password.'));
  }

  // Check if the user exists.
  User.findOne(query, function (err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new Error('Identifier or password invalid.'));
    }

    Passport.findOne({
      protocol: 'local',
      user: user.id
    }, function (err, passport) {
      if (err) {
        return next(err);
      }

      if (!passport) {
        return next('No local passport linked with this identifier.');
      }

      passport.validatePassword(password, function (err, response) {
        if (err) {
          return next(err);
        }

        if (!response) {
          return next(new Error('Identifier or password invalid.'));
        }

        next(null, user);
      });
    });
  });
};
