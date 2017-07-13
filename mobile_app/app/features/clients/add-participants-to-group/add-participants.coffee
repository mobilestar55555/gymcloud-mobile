App.controller "AddParticipantsCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'Restangular'
  'storage'
  (
    $scope
    $rootScope
    $state
    Restangular
    storage
  ) ->

    initialize = ->
      $scope.userId = storage.getCurrentUser().user_data.id
      Restangular
        .one('client_groups', $state.params.groupId)
        .get()
        .then (group) ->
          $scope.clientGroup = group
          Restangular
            .one('users', $scope.userId)
            .one('collections/clients')
            .getList()
            .then (clients) ->
              $scope.clients = clients
              compareClients($scope.clients, $scope.clientGroup)

    compareClients = (clients, group) ->
      for client in clients
        for groupClient in group.clients
          if client.id is groupClient.id
            client.is_in_group = true
            break
          else
            client.is_in_group = false

    $scope.addToGroup = ($event, toAssign, client) ->
      $event.preventDefault()
      # $event.target.checked changes after click even with preventDefault(), so using !
      client.is_in_group = !$event.target.checked
      method = Restangular
        .one('client_groups', $state.params.groupId)
        .one('members', client.id)
      if toAssign
        method
          .post()
          .then (assignee) ->
            $event.target.checked = !client.is_in_group
      else
        method
          .remove()
          .then (assignee) ->
            $event.target.checked = !client.is_in_group

    $scope.goToGroups = ->
      $rootScope.fromAddParticipants = true
      $state.go 'app.clients'

    initialize()
]