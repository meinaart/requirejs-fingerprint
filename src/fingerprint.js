/**
 * Appends timestamp to loaded resource while maintaining module names.
 *
 * Fingerprint can be added in the require config like this
 * (other config options are omitted):
 * require.config({
 *   fingerprint: '.12345'
 * });
 *
 * Or specifically per module name:
 *
 * require.config({
 *   fingerprint: {
 *     'components/component1': '.12456',
 *     'components/component2': '.456',
 *     'default': '.global-fingerprint'
 *   }
 * });
 *
 * Fingerprint is added before the extension. It only works with javascript, JSON and CSS files.
 * It does work together with the css plugin.
 *
 * If no extension is known the .js extension is added.
 *
 * You use it like this:
 * require(['fingerprint!components/component1', function(comp1) {
 *   // components/component1 will now be loaded with a fingerprint.
 * }]);
 *
 * @author Meinaart van Straalen
 */
define({
  load: function(name, req, onload, config) {
    'use strict';

    /**
     * Extend object with properties from second object
     * @param  {object} result   Original object (is going to be modified)
     * @param  {object} extender Object with additional properties
     * @return {object}          Returns result object
     */
    var extend = function(result, extender) {
      for(var key in extender) {
        result[key] = extender[key];
      }
      return result;
    };

    if(config.isBuild) {
      //avoid errors on the optimizer
      onload(null);
    } else {
      var loadName = name;

      if(!req.specified(loadName)) {
        var fingerprint = config.fingerprint;

        var APPEND = 'append';
        var BEFORE_EXTENSION = 'beforeExtension';

        var options = {
          mode: APPEND,
          suffix: '',
          prefix: '?'
        };

        // Fingerprint can be a string (global fingerprint)
        // or an object with module names and specific fingerprint per module.
        // If it can't find a specific fingerprint it will use the default one (if specified).
        if(typeof fingerprint === 'object') {
          var fingerprints = fingerprint;

          if(fingerprint.options !== undefined) {
            options = extend(options, fingerprint.options);

            // Retrieve fingerprints from fingerprint property
            fingerprints = fingerprint.fingerprints;
          }

          fingerprint = fingerprints[name] !== undefined ? fingerprints[name] : fingerprints['default'];
        }

        // Add suffix and prefix (if set)
        if(fingerprint && (options.suffix || options.prefix)) {
          fingerprint = options.prefix + fingerprint + options.suffix;
        }

        // Apply fingerprint if it's configured and module is not already defined
        if(fingerprint && !req.defined(name)) {
          // Look up URL according to the requirejs config
          var url = name.indexOf('!') === -1 ? req.toUrl(name) : name;

          if(url.match(/\.(js|css|json)$/gi)) {
            // If URL contains a known extension insert fingerprint before extension
            if(options.mode === BEFORE_EXTENSION) {
              loadName = url.replace(/\.(css|js|json)$/gi, +fingerprint + '.$1');
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
            if(url.indexOf('!') === -1) {
              loadName += '.js';
            }

            if(options.mode === APPEND) {
              loadName += fingerprint;
            }
          }
        }
        
        // Map fingerprinted name to original name
        if(name !== loadName) {
          config.map = config.map || {};
          config.map['*'] = config.map['*'] || {};
          config.map['*'][name] = loadName;
        }
      }

      // Load module (with or without fingerprint) and resolve it
      req([loadName], function(value) {
        onload(value);
      });
    }
  }
});
