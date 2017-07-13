App.controller "ForgotPasswordCtrl", [
  '$scope'
  'Restangular'
  'errorsService'
  (
    $scope
    Restangular
    errorsService
  ) ->

    $scope.emailIsSent = false

    $scope.userEmail = (email) ->
      Restangular
        .setRequestSuffix('.json')
        .all('users/password')
        .post(user: email: email)
        .then (->
          $scope.emailIsSent = true
        ), (error) ->
          if error.data.error.email[0] is 'not found'
            errorsService.errorAlert(
              'Error'
              'Account with this email does not exist'
            )
]