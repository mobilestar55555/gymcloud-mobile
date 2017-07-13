App.controller "ResetPasswordCtrl", [
  '$rootScope'
  '$scope'
  '$state'
  'Restangular'
  'errorsService'
  (
    $rootScope
    $scope
    $state
    Restangular
    errorsService
  ) ->

    resetPasswordToken = $rootScope.resetPasswordToken
    $rootScope.resetPasswordToken = null

    $scope.resetPassword = (password, password_confirmation) ->
      data =
        password: password
        password_confirmation: password_confirmation
        reset_password_token: resetPasswordToken

      Restangular
        .setRequestSuffix('.json')
        .all('users/password')
        .patch(user: data)
        .then ->
          errorsService.errorAlert(
            'Success'
            'Your password was successfully changed'
          )
          $state.go 'signIn'
]