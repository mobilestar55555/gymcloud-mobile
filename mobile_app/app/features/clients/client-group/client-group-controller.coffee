App.controller "ClientGroupCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  'ewpService'
  (
    $scope
    $state
    storage
    Restangular
    ewpService
  ) ->

    $scope.groupId = $state.params.groupId

    $scope.initialize = ->
      Restangular
        .one('client_groups', $scope.groupId)
        .get().then (group) ->
          $scope.group = group

      ewpService.getGroupWorkouts($scope.groupId).then (workouts) ->
        $scope.workoutsCount = workouts.length

      ewpService.getGroupPrograms($scope.groupId).then (programs) ->
        $scope.programsCount = programs.length

      ewpService.getGroupClients($scope.groupId).then (clients) ->
        $scope.clientsCount = clients.length

    $scope.initialize()
]