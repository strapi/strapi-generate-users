'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const bcrypt = require('bcryptjs');

// Model settings.
const settings = require('./Passport.settings.json');

/**
 * Passport model
 *
 * This the function file for Passport model.
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
    validatePassword: function (password, next) {
      bcrypt.compare(password, this.password, next);
    }
  }),

  // Do you automatically want to have time data?
  autoCreatedAt: settings.autoCreatedAt,
  autoUpdatedAt: settings.autoUpdatedAt,

  /**
   * Lifecycle callbacks
   */

  // Before create.
  beforeCreate: function (passport, next) {
    hashPassword(passport, next);
  },

  // Before update.
  beforeUpdate: function (passport, next) {
    hashPassword(passport, next);
  }
};

/**
 * Helper used for both beforeCreate and beforeUpdate
 *
 * @param {Object} passport
 * @param {Function} next
 */

function hashPassword(passport, next) {
  if (passport.hasOwnProperty('password')) {
    bcrypt.hash(passport.password, 10, function (err, hash) {
      passport.password = hash;
      next(err, passport);
    });
  } else {
    next(null, passport);
  }
}
