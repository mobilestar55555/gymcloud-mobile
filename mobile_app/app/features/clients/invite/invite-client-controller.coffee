App.controller "InviteClientCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  'clientsTypeService'
  (
    $scope
    $state
    Restangular
    storage
    clientsTypeService
  ) ->

    $scope.isInvitation = false
    $scope.buttonText = 'Save'
    $scope.userType = clientsTypeService
      .run(storage.getCurrentUser().user_data)
      .toLowerCase()

    $scope.inviteUser = ->
      $scope.isInvitation = true
      $scope.buttonText = 'Save & Invite'

    $scope.invite = (data) ->
      Restangular
        .all('clients')
        .post(data)
        .then (client) ->
          if data.email
            Restangular
              .one('users', client.id)
              .all('invite')
              .post(email: data.email)
              .then (invite) ->
                $state.go 'app.clients'
          else
            $state.go 'app.clients'
]