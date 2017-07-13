App.controller "WaitingInvitedProCtrl", [
  '$scope'
  '$state'
  'Restangular'
  (
    $scope
    $state
    Restangular
  ) ->

    $scope.sendReminder = ->
      Restangular
        .all('pros/invitation')
        .post()
        .then (result) ->
          $state.go 'signIn'
]