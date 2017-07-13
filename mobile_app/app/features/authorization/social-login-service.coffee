App.factory 'socialLoginService', [
  'storage'
  'Restangular'
  '$state'
  '$ionicLoading'
  'authService'
  'errorsService'
  (
    storage
    Restangular
    $state
    $ionicLoading
    authService
    errorsService
  ) ->

    socialLoginService = {}

    loginError = ->
      errorsService.errorAlert(
        'Invalid Email Address',
        'Try again, or Sign Up to create account.'
      )

    socialLoginService.googleLogin = (isSignup) ->
      $ionicLoading.show template: 'Logging in...'
      window.plugins.googleplus.login {
        'webClientId': AppConfig.googleWebClientId
        'offline': true
      }, ((userData) ->
        userData['is_signup'] = isSignup
        Restangular
          .one('users/mobile_auth/google_oauth2')
          .post('callback', userData)
          .then ((data) ->
            authService.socialLogin(data)
          ), (fail) ->
            window.plugins.googleplus.disconnect()
            loginError() if fail.status is 404
        $ionicLoading.hide()
      ), (msg) ->
        $ionicLoading.hide()

    socialLoginService.facebookLogin = (isSignup) ->
      facebookConnectPlugin.getLoginStatus (success) ->
        if success.status is 'connected'
          fbLoginSuccess(success, isSignup)
        else
          facebookConnectPlugin.login [ 'email', 'public_profile' ], ((success) ->
            fbLoginSuccess(success, isSignup)
          ), (error) ->
            console.log error

    fbLoginSuccess = (response, isSignup) ->
      userData = response.authResponse
      userData['is_signup'] = isSignup
      Restangular
        .one('users/mobile_auth/facebook_oauth2')
        .post('callback', userData)
        .then ((data) ->
          authService.socialLogin(data)
        ), (fail) ->
          loginError() if fail.status is 404
          console.log fail

    socialLoginService
]