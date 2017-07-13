App.controller "GroupClientsCtrl", [
  '$scope'
  'Restangular'
  '$state'
  (
    $scope
    Restangular
    $state
  ) ->

    initialize = ->
      $scope.group = Restangular
        .one('client_groups', $state.params.groupId)
        .get().$object

      $scope.clients = Restangular
        .one('client_groups', $state.params.groupId)
        .one('members')
        .getList().$object

    initialize()
]