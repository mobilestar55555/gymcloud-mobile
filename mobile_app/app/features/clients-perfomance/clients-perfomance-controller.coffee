App.controller 'ClientsPerfomanceCtrl', [
  '$scope'
  'Restangular'
  (
    $scope
    Restangular
  ) ->

    initialize = ->
      Restangular
        .one('clients_performance')
        .getList()
        .then (clientsList) ->
          $scope.clients = clientsList

    initialize()
]