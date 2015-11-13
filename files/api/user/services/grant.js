'use strict';

/**
 * Module dependencies.
 */

// Public node modules.
const _ = require('lodash');

// Purest strategies.
const Purest = require('purest');

const facebook = new Purest({
  provider: 'facebook'
});

const github = new Purest({
  provider: 'github',
  defaults: {
    headers: {
      'user-agent': 'strapi'
    }
  }
});

const google = new Purest({
  provider: 'google'
});

/**
 * Connect thanks to a third-party provider.
 *
 *
 * @param {String}    provider
 * @param {String}    access_token
 *
 * @return  {*}
 */

exports.connect = function * connect(provider, access_token) {
  const deferred = Promise.defer();

  if (!access_token) {
    deferred.reject({
      message: 'No access_token.'
    });
  } else {
    // Get the profile.
    getProfile(provider, access_token, function (err, profile) {
      if (err) {
        deferred.reject(err);
      } else {
        // We need at least the mail.
        if (!profile.email) {
          deferred.reject({
            message: 'Email was not available.'
          });
        } else {
          User.findOne({email: profile.email}).exec(function (err, user) {
            if (err) {
              deferred.reject(err);
            } else if (!user) {
              // Create the new user.
              const params = _.assign(profile, {
                id_ref: 1,
                lang: strapi.config.i18n.defaultLocale,
                template: 'standard',
                provider: provider
              });

              User.create(params).exec(function (err, user) {
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(user);
                }
              });
            } else {
              deferred.resolve(user);
            }
          });
        }
      }
    });
  }

  return deferred.promise;
};

/**
 * Helper to get profiles
 *
 * @param {String}   provider
 * @param {Function} callback
 */

function getProfile(provider, access_token, callback) {
  switch (provider) {
    case 'facebook':
      facebook.query().get('me?fields=name,email').auth(access_token).request(function (err, res, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.name,
            email: body.email
          });
        }
      });
      break;
    case 'github':
      github.query().get('user').auth(access_token).request(function (err, res, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.login,
            email: body.email
          });
        }
      });
      break;
    case 'google':
      google.query('plus').get('people/me').auth(access_token).request(function (err, res, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.displayName,
            email: body.emails[0].value
          });
        }
      });
      break;
    default:
      callback({
        message: 'Unknown provider.'
      });
      break;
  }
}
