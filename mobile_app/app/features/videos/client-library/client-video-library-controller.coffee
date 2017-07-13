App.controller 'ClientVideoLibraryCtrl', [
  '$scope'
  '$state'
  'Restangular'
  (
    $scope
    $state
    Restangular
  ) ->

    $scope.initialize = ->
      params =
        page: 1
        per_page: 25
        user_id: $state.params.userId

      Restangular
        .all('videos')
        .getList(params)
        .then (result) ->
          $scope.videos = result[1]

    $scope.initialize()
]