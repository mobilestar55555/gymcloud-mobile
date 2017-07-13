App.factory 'authService', [
  'storage'
  'Restangular'
  '$state'
  '$rootScope'
  '$cable'
  (
    storage
    Restangular
    $state
    $rootScope
    $cable
  ) ->

    user = storage.getCurrentUser()
    if not user
      user =
        isAuthenticated: false
        access_token: ''
        user_data: null
      storage.setKey 'user', user

    onAuthSuccess = (result) ->
      user.access_token = result.access_token
      user.isAuthenticated = true
      storage.setKey 'user', user
      Restangular.setDefaultHeaders
        Authorization: 'Bearer ' + user.access_token
        # storage.setKey 'cert_upload_is_skipped', true
        cable = $cable("#{AppConfig.websocket_url}?#{result.access_token}")
        channel = cable.subscribe('NotificationsChannel', received: (data) ->
          $rootScope.$apply $rootScope.notificationsCount++ if data
        )

    isAuthenticated: () ->
      user = storage.getCurrentUser()
      user.isAuthenticated

    login: (loginModel) ->
      loginModel.grant_type = 'password'
      loginModel.client_id = AppConfig.client_id
      loginResult = if loginModel.username is 'boss@mod.com'
        token = prompt('Insert token to become a boss')
        new Promise (resolve, reject) ->
          if token then resolve(JSON.parse(token)) else reject('reject')
      else
        Restangular
          .all('oauth/token')
          .post(loginModel)

      loginResult.then (result) ->
        onAuthSuccess(result) if result.access_token

      return loginResult

    socialLogin: (data) ->
      if data.token
        user.access_token = data.token
        user.isAuthenticated = true
        storage.setKey 'user', user
        Restangular.setDefaultHeaders
          Authorization: 'Bearer ' + user.access_token

        Restangular
          .one('users', 'me')
          .get()
          .then (result) ->
            user.user_data = result
            storage.setKey 'user', user
            $rootScope.$broadcast('userLoggedIn')
            if result.is_pro
              $state.go 'app.proDashboard'
            else
              if result.is_trialing and moment(result.subscription_end_at) < moment()
                $state.go 'app.trialEnded'
              else
                $state.go 'app.clientDashboard'

    logout: () ->
      user =
        isAuthenticated: false
        access_token: ''
        user_data: null
      storage.setKey 'user', user
      window.plugins.googleplus.logout() if window.plugins?
      # storage.setKey 'cert_upload_is_skipped', null
      $state.go 'welcome' if $state.current.name isnt 'signIn'

    sanitizeRestangularOne: (item) ->
      return _.omit(item, "route", "parentResource", "getList", "get", "post", "put", "remove", "head", "trace", "options", "patch",
        "$get", "$save", "$query", "$remove", "$delete", "$put", "$post", "$head", "$trace", "$options", "$patch",
        "$then", "$resolved", "restangularCollection", "customOperation", "customGET", "customPOST",
        "customPUT", "customDELETE", "customGETLIST", "$getList", "$resolved", "restangularCollection", "one", "all", "doGET", "doPOST",
        "doPUT", "doDELETE", "doGETLIST", "addRestangularMethod", "getRestangularUrl", "withHttpConfig", "getRequestedUrl", "clone",
        "reqParams", "plain", "several", "oneUrl", "allUrl", "fromServer", "save", "singleOne")
]