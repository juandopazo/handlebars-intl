/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jshint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import createFormatCache from 'intl-format-cache';

import {extend} from './utils';

export {registerWith, __addLocaleData};

// -----------------------------------------------------------------------------

var getNumberFormat   = createFormatCache(Intl.NumberFormat);
var getDateTimeFormat = createFormatCache(Intl.DateTimeFormat);
var getMessageFormat  = createFormatCache(IntlMessageFormat);
var getRelativeFormat = createFormatCache(IntlRelativeFormat);

function registerWith(Handlebars) {
    var SafeString  = Handlebars.SafeString,
        createFrame = Handlebars.createFrame,
        escape      = Handlebars.Utils.escapeExpression;

    var helpers = {
        intl             : intl,
        intlGet          : intlGet,
        formatDate       : formatDate,
        formatTime       : formatTime,
        formatRelative   : formatRelative,
        formatNumber     : formatNumber,
        formatMessage    : formatMessage,
        formatHTMLMessage: formatHTMLMessage,

        // Deprecated helpers (renamed):
        intlDate       : deprecate('intlDate', formatDate),
        intlTime       : deprecate('intlTime', formatTime),
        intlNumber     : deprecate('intlNumber', formatNumber),
        intlMessage    : deprecate('intlMessage', formatMessage),
        intlHTMLMessage: deprecate('intlHTMLMessage', formatHTMLMessage)
    };

    for (var name in helpers) {
        if (helpers.hasOwnProperty(name)) {
            Handlebars.registerHelper(name, helpers[name]);
        }
    }

    function deprecate(name, suggestion) {
        return function () {
            if (typeof console !== 'undefined' &&
                typeof console.warn === 'function') {

                console.warn(
                    '{{' + name + '}} is deprecated, use: ' +
                    '{{' + suggestion.name + '}}'
                );
            }

            return suggestion.apply(this, arguments);
        };
    }

    // -- Helpers --------------------------------------------------------------

    function intl(options) {
        /* jshint validthis:true */

        if (!options.fn) {
            throw new Error('{{#intl}} must be invoked as a block helper');
        }

        // Create a new data frame linked the parent and create a new intl data
        // object and extend it with `options.data.intl` and `options.hash`.
        var data     = createFrame(options.data),
            intlData = extend({}, data.intl, options.hash);

        data.intl = intlData;

        return options.fn(this, {data: data});
    }

    function intlGet(path, options) {
        var intlData  = options.data && options.data.intl,
            pathParts = path.split('.');

        var obj, len, i;

        // Use the path to walk the Intl data to find the object at the given
        // path, and throw a descriptive error if it's not found.
        try {
            for (i = 0, len = pathParts.length; i < len; i++) {
                obj = intlData = intlData[pathParts[i]];
            }
        } finally {
            if (obj === undefined) {
                throw new ReferenceError('Could not find Intl object: ' + path);
            }
        }

        return obj;
    }

    function formatDate(date, formatOptions, options) {
        date = resolveDate(date, 'A date must be provided to {{formatDate}}');
        return simpleFormat('date', date, formatOptions, options);
    }

    function formatTime(date, formatOptions, options) {
        date = resolveDate(date, 'A date must be provided to {{formatTime}}');
        return simpleFormat('time', date, formatOptions, options);
    }

    function formatRelative(date, formatOptions, options) {
        date = resolveDate(date, 'A date must be provided to {{formatRelative}}');
        return simpleFormat('relative', date, formatOptions, options);
    }

    function formatNumber(num, formatOptions, options) {
        if (typeof num !== 'number') {
            throw new TypeError('A number must be provided to {{formatNumber}}');
        }

        return simpleFormat('number', num, formatOptions, options);
    }

    function formatMessage(message, options) {
        if (!options) {
            options = message;
            message = null;
        }

        var hash = options.hash;

        // TODO: remove support form `hash.intlName` once Handlebars bugs with
        // subexpressions are fixed.
        if (!(message || typeof message === 'string' || hash.intlName)) {
            throw new ReferenceError('{{formatMessage}} must be provided a message or intlName');
        }

        var intlData = options.data.intl || {},
            locales  = intlData.locales,
            formats  = intlData.formats;

        // Lookup message by path name. User must supply the full path to the
        // message on `options.data.intl`.
        if (!message && hash.intlName) {
            message = intlGet(hash.intlName, options);
        }

        // When `message` is a function, assume it's an IntlMessageFormat
        // instance's `format()` method passed by reference, and call it. This
        // is possible because its `this` will be pre-bound to the instance.
        if (typeof message === 'function') {
            return message(hash);
        }

        if (typeof message === 'string') {
            message = getMessageFormat(message, locales, formats);
        }

        return message.format(hash);
    }

    function formatHTMLMessage() {
        /* jshint validthis:true */
        var options = [].slice.call(arguments).pop(),
            hash    = options.hash;

        var key, value;

        // Replace string properties in `options.hash` with HTML-escaped
        // strings.
        for (key in hash) {
            if (hash.hasOwnProperty(key)) {
                value = hash[key];

                // Escape string value.
                if (typeof value === 'string') {
                    hash[key] = escape(value);
                }
            }
        }

        // Return a Handlebars `SafeString`. This first unwraps the result to
        // make sure it's not returning a double-wrapped `SafeString`.
        return new SafeString(String(formatMessage.apply(this, arguments)));
    }

    // -- Utilities ------------------------------------------------------------

    function resolveDate(date, errMsg) {
        date = new Date(date);

        // Determine if the `date` is valid.
        if (!(date && date.getTime())) {
            throw new TypeError(errMsg);
        }

        return date;
    }

    function simpleFormat(type, value, formatOptions, helperOptions) {
        if (!helperOptions) {
            helperOptions = formatOptions;
            formatOptions = null;
        }

        var hash    = helperOptions.hash;
        var data    = helperOptions.data;
        var locales = data.intl && data.intl.locales;

        if (formatOptions) {
            if (typeof formatOptions === 'string') {
                formatOptions = intlGet('formats.' + type + '.' + formatOptions,
                        helperOptions);
            }

            formatOptions = extend({}, formatOptions, hash);
        } else {
            formatOptions = hash;
        }

        switch(type) {
            case 'date':
            case 'time':
                return getDateTimeFormat(locales, formatOptions).format(value);
            case 'number':
                return getNumberFormat(locales, formatOptions).format(value);
            case 'relative':
                return getRelativeFormat(locales, formatOptions).format(value);
            default:
                throw new Error('Unrecognized simple format type: ' + type);
        }
    }
}

function __addLocaleData(data) {
    IntlMessageFormat.__addLocaleData(data);
    IntlRelativeFormat.__addLocaleData(data);
}
