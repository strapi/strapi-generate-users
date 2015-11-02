'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');

// Settings for the route model.
const settings = require('./Route.settings.json');

/**
 * Export the route model
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
  autoUpdatedAt: settings.autoUpdatedAt
};
