'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');
const url = require('url');

// Public node modules.
const _ = require('lodash');

// Local dependencies.
const passport = require('strapi').middlewares.passport;
passport.protocols = require('./protocols');

/**
 * Connect a third-party profile to a local user
 *
 * This is where most of the magic happens when a user is authenticating with a
 * third-party provider. What it does, is the following:
 *
 *   1. Given a provider and an identifier, find a matching Passport.
 *   2. From here, the logic branches into two paths.
 *
 *     - A user is not currently logged in:
 *       1. If a Passport wasn't found, just return 401
 *       2. If a Passport was found, get the user associated with the passport.
 *
 *     - A user is currently logged in:
 *       1. If a Passport wasn't found, just return 401
 *       2. If a Passport was found, nothing needs to happen.
 *
 * As you can see, this function handles both "authentication" and "authori-
 * zation" at the same time. This is due to the fact that we pass in
 * `passReqToCallback: true` when loading the strategies, allowing us to look
 * for an existing session in the request and taking action based on that.
 *
 * For more information on auth(entication|rization) in Passport.js, check out:
 * http://passportjs.org/guide/authenticate/
 * http://passportjs.org/guide/authorize/
 *
 * @param {{}}        ctx
 * @param {*}         query
 * @param {{}}        profile
 * @param {Function}  next
 */

passport.connect = function connect(ctx, query, profile, next) {
  let user = {};

  // Set the authentication provider.
  query.provider = profile.provider;

  // If the profile object contains an email, add it to the user.
  if (profile.hasOwnProperty('email')) {
    user.email = profile.email;
  }

  // If the profile object contains a list of emails, grab the first one and add it to the user.
  if (profile.hasOwnProperty('emails')) {
    user.email = profile.emails[0].value;
  }

  // If the profile object contains a username, add it to the user.
  if (profile.hasOwnProperty('username')) {
    user.username = profile.username;
  }

  // If neither an email or a username was available in the profile, we don't
  // have a way of identifying the user in the future. Throw an error and let
  // whoever is next in the line take care of it.
  if (!Object.keys(user).length) {
    return next(new Error('Neither a username or email was available', null));
  }

  Passport.findOne({
    provider: profile.provider,
    identifier: query.identifier.toString()
  })
    .exec(function callback(error, passport) {
      if (error) {
        next(error);
      } else if (!ctx.user) {
        if (!passport) {
          User.create({
            username: user.username,
            email: user.email,
            lang: 'en',
            template: 'standard'
          })
            .exec(function (err, user) {
              if (err) {
                return next(err);
              }
              query.user = user.id;
              Passport.create(query)
                .exec(function callback(error) {
                  if (error) {
                    next(error);
                  } else {
                    User.findOne(user.id)
                      .populateAll()
                      .exec(function (err, user) {
                        if (err) {
                          return next(err);
                        }
                        next(null, user)
                      });
                  }
                });
            });
        } else {
          if (query.hasOwnProperty('tokens') && query.tokens !== passport.tokens) {
            passport.tokens = query.tokens;
          }

          // Save any updates to the Passport before moving on.
          passport
            .save(function callback(error, passport) {
              if (error) {
                next(error);
              } else {
                User.findOne(passport.user.id || passport.user)
                  .populateAll()
                  .exec(function (err, user) {
                    if (err) {
                      return next(err);
                    }
                    next(null, user);
                  });
              }
            });
        }
      } else {
        if (!passport) {
          query.user = ctx.user.id;

          Passport.create(query)
            .exec(function callback(error) {
              if (error) {
                next(error);
              } else {
                next(error, ctx.user);
              }
            });
        } else {
          next(null, ctx.user);
        }
      }
    });
};

/**
 * Create an authentication callback endpoint
 *
 * For more information on authentication in Passport.js, check out:
 * http://passportjs.org/guide/authenticate/
 *
 * @param {Context}   ctx
 * @param {Function}  next
 */

passport.callback = function * (ctx, next) {
  const params = _.assign(ctx.request.body, ctx.params);
  const provider = params.provider || 'local';
  const action = params.action || 'connect';

  if (provider === 'local' && action === 'register') {
    try {
      const user = yield passport.protocols.local.register(ctx);
      next(null, user);
    } catch (err) {
      next(err);
    }
  } else if (action === 'connect') {
    yield passport.authenticate(ctx.params.provider, {session: false}, function * (err, user) {
      if (err) {
        return next(err);
      }
      next(null, user);
    });
  } else {
    next(new Error('Invalid action'));
  }
};

/**
 * Helper used to load the Passport strategies.
 */

passport.loadStrategies = function loadStrategies() {
  const strategies = strapi.config.passport.strategies;

  _.forEach(strategies, function (strategy, key) {
    const options = {
      passReqToCallback: true
    };

    let Strategy;

    if (key === 'local') {
      _.extend(options, {
        usernameField: 'identifier',
        session: false
      });

      Strategy = require(strategy.strategy).Strategy;
      passport.use(new Strategy(options, passport.protocols.local.login));
    } else if (strategy.options && (strategy.options.consumerKey || strategy.options.clientID)) {
      const protocol = strategy.protocol;
      let callback = strategy.callback;

      if (!callback) {
        callback = path.join(strapi.config.prefix, 'auth', key, 'callback');
      }

      if (key === 'google') {
        Strategy = require('passport-google-oauth').OAuth2Strategy;
      } else {
        Strategy = require(strategy.strategy).Strategy;
      }

      const baseUrl = strapi.config.url;

      switch (protocol) {
        case 'oauth':
        case 'oauth2':
          options.callbackURL = url.resolve(baseUrl, callback);
          break;
        case 'openid':
          options.returnURL = url.resolve(baseUrl, callback);
          options.realm = baseUrl;
          options.profile = true;
          break;
      }

      // Merge the default options with any options defined in the config. All
      // defaults can be overridden, but I don't see a reason why you'd want to
      // do that.
      _.extend(options, strategies[key].options);

      passport.use(new Strategy(options, passport.protocols[protocol]));
    }
  });
};

module.exports = passport;
