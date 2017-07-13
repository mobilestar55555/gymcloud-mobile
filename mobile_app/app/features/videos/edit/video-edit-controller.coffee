App.controller 'VideoEditCtrl', [
  '$rootScope'
  '$scope'
  '$state'
  '$filter'
  'Restangular'
  '$ionicPopup'
  (
    $rootScope
    $scope
    $state
    $filter
    Restangular
    $ionicPopup
  ) ->

    initialize = ->
      $rootScope.$broadcast('hideNotificationIcon')
      $scope.$on '$ionicView.leave', ->
        $rootScope.$broadcast('showNotificationIcon')

      Restangular
        .one('videos', $state.params.videoId)
        .get().then (video) ->
          video.name = $filter('removeExtension')(video.name)
          $scope.video = video

    $scope.updateName = (name) ->
      Restangular
        .one('videos', $state.params.videoId)
        .patch(name: name)

    $scope.deleteVideo = ->
      confirmPopup = $ionicPopup.confirm(
        title: 'Delete video'
        template: 'Are you sure you want to delete this video?'
      )

      confirmPopup.then (res) ->
        if res
          Restangular
            .one('videos', $state.params.videoId)
            .remove().then (->
              $state.go 'app.videoLibrary'
            ), (error) ->
              alert error

    initialize()
]