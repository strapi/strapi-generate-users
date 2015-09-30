'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');

// Settings for the article model.
const settings = require('./User.settings.json');

/**
 * Export the article model
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

  // Merge simple attributes from settings with those ones.
  attributes: _.merge(settings.attributes, {

  }),

  // Do you automatically want to have time data?
  autoCreatedAt: settings.autoCreatedAt,
  autoUpdatedAt: settings.autoUpdatedAt,

  /**
   * Lifecycle callbacks on create
   */

  // Before creating a value.
  // beforeCreate: function (values, next) {
  //   next();
  // },

  // After creating a value.
  // afterCreate: function (newlyInsertedRecord, next) {
  //   next();
  // },

  /**
   * Lifecycle callbacks on update
   */

  // Before updating a value.
  // beforeUpdate: function (valuesToUpdate, next) {
  //  console.log('beforeUpdate', valuesToUpdate);
  //
  //   next();
  // }

  // After updating a value.
  // afterUpdate: function (updatedRecord, next) {
  //   next();
  // },

  /**
   * Lifecycle callbacks on destroy
   */

  // Before updating a value.
  // beforeDestroy: function (criteria, next) {
  //   next();
  // },

  // After updating a value.
  // afterDestroy: function (destroyedRecords, next) {
  //   next();
  // }
};
