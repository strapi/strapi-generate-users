'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Public node modules.
const _ = require('lodash');
const anchor = require('anchor');
const bcrypt = require('bcryptjs');

// Model settings
const settings = require('./User.settings.json');

/**
 * User model
 *
 * This the function file for User model.
 * We advise you to no put connection, schema and attributes
 * in this file aiming to update the model from the UI.
 */

module.exports = {

  /**
   * Basic settings
   */

  // The identity to use.
  identity: settings.identity,

  // The connection to use.
  connection: settings.connection,

  // Do you want to respect schema?
  schema: settings.schema,

  // Limit for a get request on the list.
  limit: settings.limit,

  // Merge simple attributes from settings with those ones.
  attributes: _.merge(settings.attributes, {
    // Override toJSON instance method
    // to remove `password` and `resetPasswordToken` values.
    toJSON: function () {
      const obj = this.toObject();
      delete obj.password;
      delete obj.resetPasswordToken;
      return obj;
    },
    // Validate password.
    validatePassword: function (password) {
      if (!this.password) {
        // The user has no password value.
        return false;
      } else {
        return bcrypt.compareSync(password, this.password);
      }
    }
  }),

  // Do you automatically want to have time data?
  autoCreatedAt: settings.autoCreatedAt,
  autoUpdatedAt: settings.autoUpdatedAt,

  /**
   * Lifecycle callbacks
   */

  // Before validate.
  beforeValidate: function (values, next) {
    const module = path.basename(__filename, '.js').toLowerCase();

    if (strapi.api.hasOwnProperty(module) && _.size(strapi.api[module].templates)) {
      const template = _.includes(strapi.api[module].templates, values.template) ? values.template : strapi.models[module].defaultTemplate;

      // Set template with correct value
      values.template = template;

      // Merge model type with template validations
      const templateAttributes = _.merge(_.pick(strapi.models[module].attributes, 'lang'), strapi.api[module].templates[template].attributes);
      const err = [];

      _.forEach(templateAttributes, function (rules, key) {
        if (values.hasOwnProperty(key) || key === 'lang') {
          if (key === 'lang') {

            // Set lang with correct value
            values[key] = _.includes(strapi.config.i18n.locales, values[key]) ? values[key] : strapi.config.i18n.defaultLocale;
          } else {
            // Check validations
            const rulesTest = anchor(values[key]).to(rules);

            if (rulesTest) {
              err.push(rulesTest[0]);
            }
          }
        } else {
          rules.required && err.push({
            rule: 'required',
            message: 'Missing attributes ' + key
          });
        }
      });

      // Go next step or not
      _.isEmpty(err) ? next() : next(err);
    } else {
      next(new Error('Unknown module or no template detected'));
    }
  },

  // Before create.
  beforeCreate: function (user, next) {
    strapi.api.user.services.user.hashPassword(user, next);
  },

  // Before update.
  beforeUpdate: function (user, next) {
    strapi.api.user.services.user.hashPassword(user, next);
  }
};
