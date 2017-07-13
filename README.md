## Status

[ ![Codeship Status for gymcloud/gymcloud-mobile](https://codeship.com/projects/a606bbb0-6913-0132-e764-1a44e1163757/status?branch=master)](https://codeship.com/projects/53484)

### Installation

You need installed globally:

```sh
$ npm i -g ionic bower karma protractor
$ npm i -g brunch@2.9.1 bower@1.7.9
$ npm install
$ npm install gulp-concat gulp-util gulp-sass gulp-minify-css gulp-rename shelljs bower@1.7.9
```

```sh
$ cd mobile_app
$ bower install
$ npm install
```

### Development

Run brunch wathcer:
```sh
# on mobile_app folder
$ brunch w
```

Run ionic serve:
```sh
# On project root folder
$ ionic serve
```
### Tests
Karma and protractor
```sh
$ cd mobile_app/app/tests
$ karma start karma.conf.js
$ protractor protactor.conf.js
```

### Deploy

#### Deploy to codeship

To staging:

```sh
git checkout master
git push origin master
```

To production:

Oneliner:

```sh
git checkout master && git branch -D production; git checkout -b production; git commit --allow-empty -m '[deploy]'; git push -f; git checkout master
```

#### Deploy to dokku

Prepare:

```sh
git remote add dokku-gymcloud-mobile-staging dokku@lite-1.server.gymcloud.com:gymcloud-mobile-staging
git remote add dokku-gymcloud-mobile-production dokku@lite-1.server.gymcloud.com:gymcloud-mobile-production
```

To staging:

Oneliner:

```sh
git checkout master; git branch -D build; git checkout -b build; cd mobile_app; brunch build && cd .. && git add -f www && git commit -m '[build]' && git push dokku-gymcloud-mobile-staging HEAD:master -f && git checkout master
```

To production:

Oneliner:

```sh
git checkout master; git branch -D build; git checkout -b build; cd mobile_app; sed -i 's/api.s.gymcloud.com/api.gymcloud.com/' ./app/app-config.coffee; brunch build && cd .. && git add -f www && git commit -m '[build]' && git push dokku-gymcloud-mobile-production HEAD:master -f && git reset --hard && git checkout master
```
