'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const crypto = require('crypto');

/**
 * Auth controller
 */

module.exports = {

  /**
   * Main action for auth: register and login
   * both for local auth an provider auth.
   */

  callback: function * () {
    const ctx = this;

    yield strapi.api.user.services.passport.callback(this, function (err, user) {
      if (err || !user) {
        ctx.status = 400;
        return ctx.body = err || {};
      } else {
        ctx.status = 200;
        if (_.contains(ctx.originalUrl, 'local')) {
          ctx.body = {
            jwt: strapi.api.user.services.jwt.issue(user),
            user: user
          };
        } else {
          ctx.redirect(strapi.config.frontendUrl || strapi.config.url + '?jwt=' + strapi.api.user.services.jwt.issue(user) + '&user=' + JSON.stringify(user));
        }
      }
    });
  },

  /**
   * Logout endpoint to disconnect the user.
   */

  logout: function * () {
    this.session = {};
    this.body = {};
  },

  /**
   * Send link to change user password.
   * Generate token to make change password action.
   */

  forgotPassword: function * () {
    const email = this.request.body.email;
    const url = this.request.body.url || strapi.config.url;
    let user;

    try {

      // Find the user user thanks to his email.
      user = yield User.findOne({
        email: email
      }).populate('passports');

      // User not found.
      if (!user || !user.passports[0]) {
        this.status = 400;
        return this.body = {
          status: 'error',
          message: 'This email does not exist.'
        };
      }
    } catch (err) {
      this.status = 500;
      return this.body = err;
    }

    // Generate random code.
    let code = crypto.randomBytes(64).toString('hex');

    // Select the local passport of the user.
    let localPassport = _.find(user.passports, {protocol: 'local'});

    // The user never registered using the local auth system.
    if (!localPassport) {
      this.status = 404;
      return this.body = {
        message: 'It looks like you never logged in with a classic authentification. Please log in using your usual login system.'
      }
    }

    // Set the property code of the local passport.
    localPassport.code = code;

    // Update the passport.
    localPassport.save();

    // Send an email to the user.
    try {
      yield strapi.api.email.services.email.send({
        to: user.email,
        subject: 'Reset password',
        text: url + '?code=' + code,
        html: url + '?code=' + code
      });
      this.status = 200;
      this.body = {};
    } catch (err) {
      this.status = 500;
      this.body = {
        message: 'Error sending the email'
      }
    }
  }
};
