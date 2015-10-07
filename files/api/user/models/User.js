/**
 * User model
 *
 * This the function file for User model.
 * We advise you to no put connection, schema and attributes
 * in this file aiming to update the model from the UI.
 */

/**
 * Module dependencies
 */

// Node.js core.
var fs = require('fs');
var path = require('path');

// Public node modules.
var _ = require('lodash');
var anchor = require('anchor');
var Waterline = require('waterline');

// Model settings
var settings = require('./User.settings.json');


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

  }),

  // Do you automatically want to have time data?
  autoCreatedAt: settings.autoCreatedAt,
  autoUpdatedAt: settings.autoUpdatedAt,

  // Lifecycle callbacks
  beforeValidate: function(values, next) {
    /**
     * Handle Anchor validations to consider our templates system
     *
     * WARNING: Don't remove this part of code if you don't know what you are doing
     */
    const module = path.basename(__filename, '.js').toLowerCase();

    if (strapi.api.hasOwnProperty(module) && _.size(strapi.api[module].templates)) {
      const template = _.includes(strapi.api[module].templates, values.template) ? values.template : strapi.models[module].defaultTemplate;

      // Set template with correct value
      values.template = template;

      // Merge model type with template validations
      var templateAttributes = _.merge(_.pick(strapi.models[module].attributes, 'lang'), strapi.api[module].templates[template].attributes);
      var err = [];

      _.forEach(templateAttributes, function(rules, key){
        if(values.hasOwnProperty(key) || key === 'lang') {
          if (key === 'lang') {
            // Set lang with correct value
            values[key] = _.includes(strapi.config.i18n.locales, values[key]) ? values[key] : strapi.config.i18n.defaultLocale;
          } else {
            // Check validations
            var rulesTest = anchor(values[key]).to(rules);

            if (rulesTest) {
              err.push(rulesTest[0]);
            }
          }
        } else {
          rules.required && err.push({
            rule: "required",
            message: "Missing attributes " + key
          });
        }
      });

      // Go next step or not
      _.isEmpty(err) ? next() : next(err);
    } else {
      next(new Error('Unknow module or no template detected'));
    }
  }
};
