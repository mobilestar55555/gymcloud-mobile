App.controller "WelcomeCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  '$timeout'
  'authService'
  'storage'
  (
    $scope
    $rootScope
    $state
    $timeout
    authService
    storage
  ) ->

    initialize = ->
      $timeout (->
        if $rootScope.invitationParams
          $state.go('signUp')
        if user and user.isAuthenticated and user.user_data?
          if user.user_data.is_pro
            $state.go 'app.proDashboard'
          else
            if user.is_trialing and moment(user.subscription_end_at) < moment()
              $state.go 'app.trialEnded'
            else
              $state.go 'app.clientDashboard'
      ), 1000

    user = storage.getCurrentUser()

    $scope.signUp = ->
      return false

    initialize()
]