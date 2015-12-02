'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const crypto = require('crypto');

// Public node modules.
const _ = require('lodash');
const anchor = require('anchor');

/**
 * Auth controller
 */

module.exports = {

  /**
   * Main action for login
   * both for local auth and provider auth.
   */

  callback: function * () {
    const ctx = this;

    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;
    const access_token = ctx.query.access_token;

    if (provider === 'local') {
      // The identifier is required.
      if (!params.identifier) {
        ctx.status = 400;
        return ctx.body = {
          message: 'Please provide your username or your e-mail.'
        };
      }

      // The password is required.
      if (!params.password) {
        ctx.status = 400;
        return ctx.body = {
          message: 'Please provide your password.'
        };
      }

      const query = {};

      // Check if the provided identifier is an email or not.
      const isEmail = !anchor(params.identifier).to({
        type: 'email'
      });

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier;
      } else {
        query.username = params.identifier;
      }

      // Check if the user exists.
      try {
        const user = yield User.findOne(query);

        if (!user) {
          ctx.status = 403;
          return ctx.body = {
            message: 'Identifier or password invalid.'
          };
        }

        // The user never registered with the `local` provider.
        if (!user.password) {
          ctx.status = 400;
          return ctx.body = {
            message: 'This user never set a local password, please login thanks to the provider used during account creation.'
          };
        }

        const validPassword = user.validatePassword(params.password);

        if (!validPassword) {
          ctx.status = 403;
          return ctx.body = {
            message: 'Identifier or password invalid.'
          };
        } else {
          ctx.status = 200;
          ctx.body = {
            jwt: strapi.api.user.services.jwt.issue(user),
            user: user
          };
        }
      } catch (err) {
        ctx.status = 500;
        return ctx.body = {
          message: err.message
        };
      }
    } else {
      // Connect the user thanks to the third-party provider.
      try {
        const user = yield strapi.api.user.services.grant.connect(provider, access_token);

        ctx.redirect(strapi.config.frontendUrl || strapi.config.url + '?jwt=' + strapi.api.user.services.jwt.issue(user) + '&user=' + JSON.stringify(user));
      } catch (err) {
        ctx.status = 500;
        return ctx.body = {
          message: err.message
        };
      }
    }
  },

  /**
   * Register endpoint for local user.
   */

  register: function * () {
    const ctx = this;
    const params = _.assign(ctx.request.body, {
      id_ref: 1,
      lang: strapi.config.i18n.defaultLocale,
      template: 'default',
      provider: 'local'
    });

    // Password is required.
    if (!params.password) {
      ctx.status = 400;
      return ctx.body = {
        message: 'Invalid password field.'
      };
    }

    // Throw an error if the password selected by the user
    // contains more than two times the symbol '$'.
    if (strapi.api.user.services.user.isHashed(params.password)) {
      ctx.status = 400;
      return ctx.body = {
        message: 'Your password can not contain more than three times the symbol `$`.'
      };
    }

    // First, check if the user is the first one to register.
    try {
      const usersCount = yield User.count();

      // Create the user
      let user = yield User.create(params);

      // Check if the user is the first to register
      if (usersCount === 0) {
        // Find the roles
        const roles = yield Role.find();

        // Add the role `admin` to the current user
        user.roles.add(_.find(roles, {name: 'admin'}));

        // Prevent double encryption.
        delete user.password;

        user = yield user.save();
      }

      ctx.status = 200;
      ctx.body = {
        jwt: strapi.api.user.services.jwt.issue(user),
        user: user
      };
    } catch (err) {
      ctx.status = 500;
      return ctx.body = {
        message: err.message
      };
    }
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
      user = yield User.findOne({email: email});

      // User not found.
      if (!user) {
        this.status = 400;
        return this.body = {
          message: 'This email does not exist.'
        };
      }
    } catch (err) {
      this.status = 500;
      return this.body = {
        message: err.message
      };
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString('hex');

    // Set the property code of the local passport.
    user.resetPasswordToken = resetPasswordToken;

    // Update the user.
    try {
      user = yield user.save();
    } catch (err) {
      this.status = 500;
      return this.body = {
        message: err.message
      };
    }

    // Send an email to the user.
    try {
      yield strapi.api.email.services.email.send({
        to: user.email,
        subject: 'Reset password',
        text: url + '?code=' + resetPasswordToken,
        html: url + '?code=' + resetPasswordToken
      });
      this.status = 200;
      this.body = {};
    } catch (err) {
      this.status = 500;
      this.body = {
        message: 'Error sending the email'
      };
    }
  },

  /**
   * Change user password.
   */

  changePassword: function * () {
    // Init variables.
    const params = _.assign({}, this.request.body, this.params);
    let user;

    if (params.password && params.passwordConfirmation && params.password === params.passwordConfirmation && params.code) {

      try {
        user = yield User.findOne({resetPasswordToken: params.code});

        if (!user) {
          this.status = 400;
          return this.body = {
            message: 'Incorrect code provided.'
          };
        }

        // Delete the current code
        user.resetPasswordToken = null;

        // Set the new password (automatically crypted in the `beforeUpdate` function).
        user.password = params.password;

        // Update the user.
        user = yield user.save();

        this.status = 200;
        return this.body = {
          jwt: strapi.api.user.services.jwt.issue(user),
          user: user
        };
      } catch (err) {
        this.status = 500;
        return this.body = {
          message: err.message
        };
      }
    } else if (params.password && params.passwordConfirmation && params.password !== params.passwordConfirmation) {
      this.status = 400;
      return this.body = {
        message: 'Passwords not matching.'
      };
    } else {
      this.status = 400;
      return this.body = {
        status: 'error',
        message: 'Incorrect params provided.'
      };
    }
  }
};
