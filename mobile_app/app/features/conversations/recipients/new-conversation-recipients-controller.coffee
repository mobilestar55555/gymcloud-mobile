App.controller "NewConversationRecipientsCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  (
    $scope
    $state
    Restangular
    storage
  ) ->

    initialize = ->
      $scope.currentUserId = storage.getCurrentUser().user_data.id
      Restangular
        .one('users', $scope.currentUserId)
        .one('collections/clients')
        .getList()
        .then (clients) ->
          $scope.clients = clients
          # Length is 1 as pro is client for himself
          $scope.emptyClients = clients.length is 1

    initialize()
]