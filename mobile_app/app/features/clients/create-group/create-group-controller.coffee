App.controller "CreateGroupCtrl", [
  '$scope'
  '$state'
  'Restangular'
  (
    $scope
    $state
    Restangular
  ) ->

    $scope.create = (name) ->
      Restangular
        .all('client_groups')
        .post(name: name)
        .then (group) ->
          $state.go 'app.addParticipants',
            groupId: group.id
]