exports.config =
  npm:
    enabled: false
  conventions:
    assets:  /^app\/assets\//
    ignored: /^app\/tests\//
  modules:
    definition: false
    wrapper: false
  paths:
    public: '../www'
  files:
    javascripts:
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': (path) ->
          /^(bower_components|vendor)/.test(path)\
          and not /^(bower_components\/angular\/)/.test(path)
      order:
        before: ['vendor/ionic-1.3.1/js/ionic.bundle.min.js']
        after: ['vendor/ionic-1.3.1/js/angular-resource.min.js']

    stylesheets:
      joinTo:
        'css/app.css': /^(app|vendor|bower_components)/
