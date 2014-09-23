/**
 * Appends timestamp when loading modules without modifying module name.
 *
 * Fingerprint can be added in the require config like this
 * (other config options are omitted):
 * require.config({
 *   config: {
 *     fingerprint: '.12345'
 *   }
 * });
 *
 * Or specifically per module name:
 *
 * require.config({
 *   config: {
 *     fingerprint: {
 *       'components/component1': '.12456',
 *       'components/component2': '.456',
 *       'default': '.global-fingerprint'
 *     }
 *   }
 * });
 *
 * It does work together with the css plugin.
 *
 * If no extension is known the .js extension is added by default.
 *
 * You use it like this:
 * require(['fingerprint!components/component1', function(comp1) {
 *   // components/component1 will now be loaded with a fingerprint.
 * }]);
 *
 * For full documentation and examples see:
 * https://github.com/meinaart/requirejs-fingerprint/
 * 
 * License: MIT
 * Version: 1.0.3
 * @author Meinaart van Straalen - https://github.com/meinaart
 */
define(['module'], function(module) {
  'use strict';

  var moduleConfig = (module.config && module.config());
  var defaultFingerprint;
  var fingerprints;

  if(!moduleConfig) {
    throw new Error('Require.fingerprint need to be configured');
  }

  if(typeof moduleConfig === 'string') {
    defaultFingerprint = moduleConfig;
  }

  var APPEND = 'append';
  var BEFORE_EXTENSION = 'beforeExtension';

  var options = {
    mode: APPEND,
    suffix: '',
    prefix: '?',
    defaultExtension: '.js',
    extensions: ['js', 'css', 'json']
  };

  /**
   * Extend object with properties from second object
   * @param  {object} result   Original object (is going to be modified)
   * @param  {object} extender Object with additional properties
   * @return {object}          Returns result object
   */
  function extend(result, extender) {
    for(var key in extender) {
      result[key] = extender[key];
    }
    return result;
  }

  // Fingerprint can be a string (global fingerprint)
  // or an object with module names and specific fingerprint per module.
  // If it can't find a specific fingerprint it will use the default one (if specified).
  if(typeof moduleConfig === 'object') {
    fingerprints = moduleConfig.fingerprint || moduleConfig.fingerprints || moduleConfig;

    if(typeof fingerprints === 'string') {
      defaultFingerprint = fingerprints;
      fingerprints = undefined;
    } else if(fingerprints['default']) {
      defaultFingerprint = fingerprints['default'];
    }

    if(moduleConfig.options !== undefined) {
      options = extend(options, moduleConfig.options);
    }
  }

  // Case insensitive regular expression to match on extensions specified in options.extensions
  var extensionRegex = new RegExp('\\.(' + options.extensions.join('|') + ')$', 'gi');

  return {
    load: function(name, req, onLoad, config) {
      if(config.isBuild) {
        //avoid errors on the optimizer
        onLoad(null);
      } else {
        var loadName = name;

        if(!req.specified(name)) {
          var fingerprint = defaultFingerprint;

          if(fingerprints && fingerprints[name] !== undefined) {
            fingerprint = fingerprints[name];
          }

          // Add suffix and prefix (if set)
          if(fingerprint && (options.suffix || options.prefix)) {
            fingerprint = options.prefix + fingerprint + options.suffix;
          }

          // Apply fingerprint if it's configured and module is not already defined
          if(fingerprint && !req.defined(name)) {
            // Look up URL according to the requirejs config
            var url = name.indexOf('!') === -1 ? req.toUrl(name) : name;

            if(url.match(extensionRegex)) {
              // If URL contains a known extension insert fingerprint before extension
              if(options.mode === BEFORE_EXTENSION) {
                loadName = url.replace(extensionRegex, +fingerprint + '.$1');
              } else {
                loadName = url + fingerprint;
              }
            } else {
              if(options.mode === BEFORE_EXTENSION) {
                loadName = url + fingerprint;
              } else {
                loadName = url;
              }

              // Only add javascript extension if no other modules are defined (such as css!) 
              if(url.indexOf('!') === -1 && options.defaultExtension) {
                loadName += options.defaultExtension;
              }

              if(options.mode === APPEND) {
                loadName += fingerprint;
              }
            }

            // Map fingerprinted name to original name
            if(name !== loadName) {
              config.map = config.map || {};
              config.map['*'] = config.map['*'] || {};

              // Remove ./ from beginning of string, otherwise paths do not match
              // withing RequireJS
              config.map['*'][name] = loadName.replace(/^\.\//, '');
            }
          }
        }

        // Load module (with or without fingerprint) and resolve it
        req([loadName], function(value) {
          // Resolve
          onLoad(value);
        });
      }
    }
  };
});
