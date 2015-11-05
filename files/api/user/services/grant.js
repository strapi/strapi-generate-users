'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const Purest = require('purest');
const providers = {
  facebook: new Purest({provider: 'facebook'}),
  google: new Purest({provider: 'google'}),
  twitter: new Purest({provider: 'twitter'})
};

/**
 * Connect a third-party profile to a local user
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
    return deferred.reject({message: 'No access_token.'});
  }

  if (!providers.provider) {
    return deferred.reject({message: 'Unknown provider.'});
  }

  // Get the profile
  providers[provider].query().get('me').auth(access_token).request(function (err, res, body) {
    if (err) {
      return deferred.reject(err);
    }

    const profile = {
      username: body.username,
      email: body.email
    };

    // If neither an email or a username was available in the profile, we don't
    // have a way of identifying the user
    if (!profile.username && !profile.email) {
      deferred.reject({message: 'Neither a username nor email was available.'});
    }

    User.findOne(profile).exec(function (err, user) {
      if (err) {
        return deferred.reject(err);
      }

      if (!user) {
        // Create the new user
        const params = _.assign(profile, {
          id_ref: 1,
          lang: strapi.config.i18n.defaultLocale,
          template: 'standard',
          provider: provider
        });

        User.create(params).exec(function (err, user) {
          if (err) {
            return deferredd.reject(err);
          }

          deferred.resolve(user);

          return deferred.promise;
        });
      } else {
        deferred.resolve(user);

        return deferred.promise;
      }
    });
  });
};
