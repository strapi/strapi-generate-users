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

const linkedin = new Purest({
  provider: 'linkedin'
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
  return new Promise(function (resolve, reject) {
    if (!access_token) {
      reject({
        message: 'No access_token.'
      });
    } else {
      // Get the profile.
      getProfile(provider, access_token, function (err, profile) {
        if (err) {
          reject(err);
        } else {
          // We need at least the mail.
          if (!profile.email) {
            reject({
              message: 'Email was not available.'
            });
          } else {
            User.findOne({email: profile.email}).exec(function (err, user) {
              if (err) {
                reject(err);
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
                    reject(err);
                  } else {
                    resolve(user);
                  }
                });
              } else {
                resolve(user);
              }
            });
          }
        }
      });
    }
  });
};

/**
 * Helper to get profiles
 *
 * @param {String}   provider
 * @param {Function} callback
 */

function getProfile(provider, access_token, callback) {
  let fields;
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
    case 'linkedin2':
      fields = [
        'public-profile-url', 'email-address'
      ];
      linkedin.query().select('people/~:(' + fields.join() + ')?format=json').auth(access_token).request(function (err, res, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: substr(body.publicProfileUrl.lastIndexOf('/') + 1),
            email: body.emailAddress
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
