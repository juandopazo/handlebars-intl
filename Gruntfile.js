'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            dist: 'dist/',
            lib : 'lib/',
            tmp : 'tmp/'
        },

        copy: {
            tmp: {
                expand : true,
                flatten: true,
                src    : ['tmp/src/*.js'],
                dest   : 'lib/'
            }
        },

        concat: {
            dist_with_locales: {
                src: ['dist/handlebars-intl.js', 'dist/locale-data/*.js'],
                dest: 'dist/handlebars-intl-with-locales.js'
            }
        },

        jshint: {
            all: ['index.js', 'src/*.js', '!src/en.js', 'tests/*.js']
        },

        benchmark: {
            all: {
                src: ['tests/benchmark/*.js']
            }
        },

        extract_cldr_data: {
            options: {
                fields : ['second', 'minute', 'hour', 'day', 'month', 'year'],
                plurals: true
            },

            src_en: {
                dest: 'src/en.js',

                options: {
                    locales: ['en'],
                    prelude: '// GENERATED FILE\n',

                    wrapEntry: function (entry) {
                        return 'export default ' + entry + ';';
                    }
                }
            },

            lib_all: {
                dest: 'lib/locales.js',

                options: {
                    prelude: [
                        '// GENERATED FILE',
                        'var HandlebarsIntl = require("./helpers");\n\n'
                    ].join('\n'),

                    wrapEntry: function (entry) {
                        return 'HandlebarsIntl.__addLocaleData(' + entry + ');';
                    }
                }
            },

            dist_all: {
                dest: 'dist/locale-data/',

                options: {
                    wrapEntry: function (entry) {
                        return 'HandlebarsIntl.__addLocaleData(' + entry + ');';
                    }
                }
            }
        },

        bundle_jsnext: {
            dest: 'dist/handlebars-intl.js',

            options: {
                namespace: 'HandlebarsIntl'
            }
        },

        cjs_jsnext: {
            dest: 'tmp/'
        },

        uglify: {
            options: {
                preserveComments: 'some'
            },

            dist: {
                options: {
                    sourceMap              : true,
                    sourceMapIn            : 'dist/handlebars-intl.js.map',
                    sourceMapIncludeSources: true
                },

                files: {
                    'dist/handlebars-intl.min.js': [
                        'dist/handlebars-intl.js'
                    ]
                }
            },

            dist_with_locales: {
                files: {
                    'dist/handlebars-intl-with-locales.min.js': [
                        'dist/handlebars-intl-with-locales.js'
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    base: '.',
                    port: 9999
                }
            }
        },

        'saucelabs-mocha': {
            all: {
                options: {
                    urls: ['http://127.0.0.1:9999/tests/index.html'],
                    build: process.env.TRAVIS_BUILD_NUMBER,
                    sauceConfig: {
                        'record-video': false,
                        'capture-html': false,
                        'record-screenshots': false,
                        'command-timeout': 60
                    },
                    throttled: 3,
                    browsers: [
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows XP',
                            version: '7'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 7',
                            version: '8'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 7',
                            version: '9'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8',
                            version: '10'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'Windows 7',
                            version: '37'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'Windows 7',
                            version: '32'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.9',
                            version: '7.1'
                        },
                        {
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.4'
                        },
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.9',
                            version: '7'
                        }
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-benchmark');
    grunt.loadNpmTasks('grunt-bundle-jsnext-lib');
    grunt.loadNpmTasks('grunt-extract-cldr-data');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('sauce', [
        'connect',
        'saucelabs-mocha'
    ]);

    grunt.registerTask('cldr', ['extract_cldr_data']);

    grunt.registerTask('compile', [
        'jshint',
        'bundle_jsnext',
        'concat:dist_with_locales',
        'uglify',
        'cjs_jsnext',
        'copy:tmp'
    ]);

    grunt.registerTask('default', [
        'clean',
        'cldr',
        'compile'
    ]);
};
