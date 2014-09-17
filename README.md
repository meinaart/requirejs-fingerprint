# RequireJS fingerprint plugin

This is a simple fingerprint plugin for [RequireJS](http://requirejs.org/)

For more plugins check [RequireJS Wiki](https://github.com/jrburke/requirejs/wiki/Plugins).


## Install

You can use [bower](http://bower.io/) to install it easily:

```
bower install --save requirejs-fingerprint
```

## Documentation

check the `examples` folder. All the info you probably need will be inside
comments or on the example code itself.

## Basic usage

Put the plugins inside the `baseUrl` folder (usually same folder as the main.js
file) or create an alias to the plugin location:

```js
require.config({
    paths : {
        //create alias to plugins (not needed if plugins are on the baseUrl)
        fingerprint: 'lib/require/fingerprint',
    }
});


## Writing your own plugins

Check [RequireJS documentation](http://requirejs.org/docs/plugins.html) for
a basic reference and use other plugins as reference. RequireJS official
plugins are a good source for learning.

Also be sure to check [RequireJS Wiki](https://github.com/jrburke/requirejs/wiki/Plugins).

## Author

[Meinaart van Straalen](http://github.com/meinaart/)

## License

All the plugins are released under the MIT license.