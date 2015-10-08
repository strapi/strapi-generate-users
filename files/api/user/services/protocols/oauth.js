'use strict';

/**
 * Module dependencies
 */

/**
 * OAuth Authentication Protocol
 *
 * OAuth 1.0 is a delegated authentication strategy that involves multiple
 * steps. First, a request token must be obtained. Next, the user is redirected
 * to the service provider to authorize access. Finally, after authorization has
 * been granted, the user is redirected back to the application and the request
 * token can be exchanged for an access token. The application requesting access,
 * known as a consumer, is identified by a consumer key and consumer secret.
 *
 * For more information on OAuth in Passport.js, check out:
 * http://passportjs.org/guide/oauth/
 *
 * @param {Context}   ctx
 * @param {string}    token
 * @param {string}    tokenSecret
 * @param {{}}        profile
 * @param {Function}  next
 */

module.exports = function oauth(ctx, token, tokenSecret, profile, next) {
  const query = {
    identifier: profile.id,
    protocol: 'oauth',
    tokens: {
      token: token
    }
  };

  if (tokenSecret !== undefined) {
    query.tokens.tokenSecret = tokenSecret;
  }

  return strapi.modules.user.services.passport.connect(ctx, query, profile, next);
};
