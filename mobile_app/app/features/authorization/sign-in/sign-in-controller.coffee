App.controller "SignInCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  'authService'
  'socialLoginService'
  'Restangular'
  'authCallback'
  (
    $scope
    $rootScope
    $state
    storage
    authService
    socialLoginService
    Restangular
    authCallback
  ) ->

    initialize = ->
      if user and user.isAuthenticated and user.user_data?
        $scope._goToDashboard(user.user_data)

    $scope.user = {}
    user = storage.getCurrentUser()

    $scope._goToDashboard = (user) ->
      if user.is_pro
        $state.go 'app.proDashboard'
      else
        if user.is_trialing and moment(user.subscription_end_at) < moment()
          $state.go 'app.trialEnded'
        else
          $state.go 'app.clientDashboard'

    $scope.login = ->
      if $scope.user.username and $scope.user.password
        authService
          .login($scope.user)
          .then(_.bind(authCallback.fn, authCallback, $scope))

    $scope.googleLogin = ->
      return false
      socialLoginService.googleLogin(false)

    $scope.facebookLogin = ->
      return false
      socialLoginService.facebookLogin(false)

    initialize()
]