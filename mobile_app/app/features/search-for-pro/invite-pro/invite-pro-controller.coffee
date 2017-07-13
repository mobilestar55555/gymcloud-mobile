App.controller "InviteProCtrl", [
  '$scope'
  '$state'
  'Restangular'
  (
    $scope
    $state
    Restangular
  ) ->

    $scope.invitePro = (pro) ->
      Restangular
        .all('pros')
        .post(pro)
        .then (result) ->
          Restangular
            .all('pros/invitation')
            .post()
            .then (result) ->
              $state.go 'proInvitationSent'
]