'use strict';

/**
 * Module dependencies
 */

// Public node modules
const _ = require('lodash');
const jwt = require('jsonwebtoken');

/**
 * Service method to generate a new token based on payload we want to put on it.
 *
 * @param   {String}    payload
 *
 * @return {*}
 */

exports.issue = function (payload) {
  return jwt.sign(
    _.clone(payload),
    process.env.JWT_SECRET || strapi.api.user.config.jwtSecret || 'oursecret'
  );
};

/**
 * Service method to verify that the token we received on a req hasn't be tampered with.
 *
 * @param   {String}    token   Token to validate
 *
 * @return {*}
 */

exports.verify = function (token) {
  return new Promise(function (resolve, reject) {
    jwt.verify(
      token,
      process.env.JWT_SECRET || strapi.api.user.config.jwtSecret || 'oursecret',
      {},
      function (err, user) {
        if (err || !user || !user.id) {
          return reject(err);
        }
        resolve(user);
      }
    );
  });
};

/**
 * Service method to get current user token. Note that this will also verify actual token value.
 *
 * @param   {Object}    ctx         Context
 * @param   {Boolean}   throwError  Throw error from invalid token specification
 *
 * @return  {*}
 */

exports.getToken = function *(ctx, throwError) {
  const params = _.assign({}, ctx.request.body, ctx.request.query);

  let token = '';

  // Yeah we got required 'authorization' header.
  if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
    const parts = ctx.request.header.authorization.split(' ');

    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    } else if (throwError) {
      throw new Error('Invalid authorization header format. Format is Authorization: Bearer [token]');
    }
  } else if (params.token) {
    token = params.token;
  } else if (throwError) {
    throw new Error('No authorization header was found');
  }

  return exports.verify(token);
};
