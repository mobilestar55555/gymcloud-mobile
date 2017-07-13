'use strict'

App = angular.module('gymcloud', [
  'ionic'
  'ngResource'
  'ngCordova'
  'restangular'
  'angularMoment'
  'ngFileUpload'
  'ngIOS9UIWebViewPatch'
  'ngInflection'
  'angular.filter'
  'ngCable'
  'monospaced.elastic'
]).run [
  '$rootScope'
  '$state'
  '$window'
  '$ionicPlatform'
  '$ionicLoading'
  '$ionicSideMenuDelegate'
  'errorsService'
  'urlInterceptionService'
  'authService'
  'Restangular'
  'storage'
  '$timeout'
  '$cable'
  '$cordovaPushV5'
  (
    $rootScope
    $state
    $window
    $ionicPlatform
    $ionicLoading
    $ionicSideMenuDelegate
    errorsService
    urlInterceptionService
    authService
    Restangular
    storage
    $timeout
    $cable
    $cordovaPushV5
  ) ->

    urlInterceptionService.redirectWeb() if document.URL.match(/^https?:/)

    $window.addEventListener 'urlInterception', (e) ->
      urlInterceptionService.redirect(e.detail.url)

    currentUser = storage.getCurrentUser()

    $ionicPlatform.ready ->
      if window.StatusBar
        StatusBar.styleDefault()

      if window.cordova?.plugins?
        cordova.plugins.Keyboard?.disableScroll(true)
        cordova.plugins.Keyboard?.hideKeyboardAccessoryBar(false)
        permissionsPlugin = cordova.plugins.permissions?
        errorCallback = ->
          console.log "something went wrong"

        options =
          android:
            senderID: '512657583504'
            icon: 'gymcloud'
            iconColor: 'grey'
          ios:
            alert: 'true'
            badge: true
            sound: 'true'
          windows: {}

        token = ''
        $cordovaPushV5.initialize(options).then ->
          $cordovaPushV5.onNotification()
          $cordovaPushV5.onError()
          $cordovaPushV5.register().then (registrationId) ->
            token = registrationId

        $rootScope.$on 'userLoggedIn', (event) ->
          os = if navigator.userAgent.toLowerCase().indexOf("android") > -1
            'android'
          else
            'ios'

          params =
            token: token
            os: os

          Restangular
            .all('device_tokens')
            .post(params)

        $rootScope.$on '$cordovaPushV5:notificationReceived', (event, data) ->
          if data.additionalData.conversation_id
            state = if currentUser.user_data.is_pro
              'app.proConversation'
            else
              'app.clientConversation'
            if $state.current.name is state
              $rootScope.$broadcast('newConversationPush', data)
            else
              $rootScope.messageCategory = data.additionalData.message_category
              $state.go state,
                conversationId: data.additionalData.conversation_id

        checkPermissionCallback = (value) ->
          (status) ->
            return if status.hasPermission
            permissionsPlugin.requestPermission value, ((status) ->
              errorCallback() if !status.hasPermission
            ), errorCallback
        permissionsPlugin.hasPermission(permissionsPlugin.CAMERA, checkPermissionCallback(permissionsPlugin.CAMERA), errorCallback)
        permissionsPlugin.hasPermission(permissionsPlugin.READ_EXTERNAL_STORAGE, checkPermissionCallback(permissionsPlugin.READ_EXTERNAL_STORAGE), null)

      # $rootScope.$on '$stateChangeSuccess', ->
      #   if cordova? and typeof $window.ga != undefined
      #     $window.ga.startTrackerWithId 'UA-55966916-2'
      #     $window.ga.trackView $state.current.name
      #   else
      #     console.log 'Google Analytics Unavailable'

    loadingCount = 0
    $rootScope.$on 'loading:show', ->
      $ionicLoading.show template: 'Loading...', delay: 500

    $rootScope.$on 'loading:hide', ->
      $ionicLoading.hide()

    if currentUser.access_token
      Restangular.setDefaultHeaders
        Authorization: 'Bearer ' + currentUser.access_token

    $rootScope.notificationsCount = 0

    if !!currentUser.access_token
      states = [
        'app.proConversation'
        'app.clientConversation'
        'app.personalWorkoutEventResults'
      ]
      cable = $cable("#{AppConfig.websocket_url}?#{currentUser.access_token}")
      channel = cable.subscribe('NotificationsChannel', received: (data) ->
        $rootScope.$apply $rootScope.notificationsCount++ if data
      )
      messages = cable.subscribe('MessagesChannel', received: (data) ->
        return false unless data
        if $state.current.name in states
          $rootScope.$broadcast('newConversationMessage', data.message)
        else
          $ionicLoading.show
            template: "You received new message from #{data.message.sender_name}"
            duration: 3000
      )

    Restangular.setRequestInterceptor (elem, operation, route, url) ->
      return false if route is 'collections/library'
      $rootScope.$broadcast 'loading:show'  if ++loadingCount is 1
      elem

    Restangular.setResponseInterceptor (data, operation, what, url, response) ->
      $rootScope.$broadcast 'loading:hide'  if --loadingCount is 0
      $rootScope.$broadcast('scroll.refreshComplete')
      data

    Restangular.setErrorInterceptor (response, deferred, responseHandler) ->
      if response.status is 401 and $state.current.name is 'signIn'
        if response.data.error is 'user_is_not_active'
          errorsService.errorAlert(
            'Login Error',
            response.data.error_description
          )
        else
          errorsService.errorAlert(
            'Login Error',
            'The email address or password you entered does not match our records.
            Please try again.'
          )
      else if response.status is 422 and $state.current.name is 'signUp'
        errorsService.errorAlert(
            'Signup Error',
            "Email #{response.data.error.email[0]}"
          )
      else if response.status is 401
        $rootScope.$broadcast 'loading:hide'
        authService.logout()
        if response.data.message
          errorsService.errorAlert(response.data.error, response.data.message.generic)
        else if response.data.error_description
          errorsService.errorAlert(response.data.error, response.data.error_description)
        return true
      else if response.status in [500, 0, 403]
        $rootScope.$broadcast 'loading:hide'
        $state.go($state.current)
        if response.data.message
          errorsService.errorAlert(response.data.error, response.data.message.generic)
        else if response.data.error_description
          errorsService.errorAlert(response.data.error, response.data.error_description)
        else
          errorsService.errorAlert('Error', response.data.error)
      else if response.status is 453
        $state.go 'waitingInvitedPro'
      else if response.status is 452
        $state.go 'waitingGymcloudPro'
      else if response.status is 455
        $state.go 'app.certBlockedAccount'
      $rootScope.$broadcast 'loading:hide'
      return true

    $rootScope.$on '$stateChangeStart', (event, toState, toParams, fromState, fromParams) ->
      user = currentUser.user_data
      if user?.is_trialing and not user?.is_pro and moment(user?.subscription_end_at) < moment() and toState.name isnt 'app.trialEnded'
        $state.go 'app.trialEnded'

      if fromState.url is '^' or $state.hide_previous
        $state.hide_previous = false
        $state.previous = false
      else
        $state.previous = true

      if toState.edge
        $ionicSideMenuDelegate.edgeDragThreshold(true)
      else
        $ionicSideMenuDelegate.edgeDragThreshold(false)

      if toState.private and !authService.isAuthenticated()
        event.preventDefault()
        $state.go('welcome')
]