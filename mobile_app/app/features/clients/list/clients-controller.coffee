App.controller "ClientsCtrl", [
  '$scope'
  '$state'
  '$rootScope'
  'Restangular'
  'storage'
  'clientsTypeService'
  '$ionicTabsDelegate'
  (
    $scope
    $state
    $rootScope
    Restangular
    storage
    clientsTypeService
    $ionicTabsDelegate
  ) ->

    initialize = ->
      $scope.currentUser = storage.getCurrentUser().user_data
      $scope.preferredState = 'app.inviteClient'
      $scope.userType = clientsTypeService.run($scope.currentUser)
      fetchList('clients')
      fetchList('client_groups')

    $rootScope.$on '$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) ->
      if fromState.name is 'app.inviteClient' and toState.name is 'app.clients'
        fetchList('clients')
      if fromState.name is 'app.addParticipants' and toState.name is 'app.clients'
        fetchList('client_groups')

    $scope.userId = storage.getCurrentUser().user_data.id

    fetchList = (type) ->
      Restangular
        .one('users', $scope.userId)
        .one('collections', type)
        .getList()
        .then (list) ->
          if type is 'clients'
            $scope.clients = list
            # Length is 1 as pro is client for himself
            $scope.emptyClients = true if list.length is 1
          else
            $scope.groups = list
            $scope.emptyGroups = true if list.length is 0

    $scope.selectIndividuals = ->
      $scope.preferredState = 'app.inviteClient'

    $scope.selectGroups = ->
      $scope.preferredState = 'app.createGroup'

    $scope.goToState = ->
      $state.go $scope.preferredState
      # TEMPORARY DISABLE CERT REQUIREMENT WHEN ADDING CLIENT
      # if $scope.preferredState is 'app.inviteClient' and
      # not $scope.currentUser.has_certificate
      #   $state.go 'app.certBlockedClientsAdd'
      # else
      #   $state.go $scope.preferredState

    initialize()
]