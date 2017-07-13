App.controller "GetProCtrl", [
  '$scope'
  '$state'
  'Restangular'
  (
    $scope
    $state
    Restangular
  ) ->

    $scope.getPro = (selectionType) ->
      if selectionType is 'invite'
        $state.go 'invitePro'
      else if selectionType is 'find'
        Restangular
          .all('pros/request')
          .post()
          .then (result) ->
            $state.go 'proRequestSent'
]