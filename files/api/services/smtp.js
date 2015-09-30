'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const nodemailer = require('nodemailer');

// Init the transporter
const transporter = nodemailer.createTransport();

/**
 * SMTP global service
 */

module.exports = {

  /**
   * Send an e-mail
   *
   * @param {Object} options
   * @param {Function} cb
   *
   * @return {Promise}
   */

  send: function (options, cb) {

    // Init the Promise.
    const deferred = Promise.defer();

    // Check the callback type.
    cb = _.isFunction(cb) ? cb : _.noop;

    // Default from.
    options.from = strapi.config.smtp.from;

    // Send the email.
    transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    }, function (err, data) {
      if (err) {
        cb(err);
        deferred.reject(err);
      } else {
        cb(null, data);
        deferred.resolve(data);
      }
    });

    return deferred.promise;
  }
};
