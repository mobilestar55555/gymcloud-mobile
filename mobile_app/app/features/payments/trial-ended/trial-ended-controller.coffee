App.controller "TrialEndedCtrl", [
  '$ionicSideMenuDelegate'
  'storage'
  '$scope'
  (
    $ionicSideMenuDelegate
    storage
    $scope
  ) ->

    $ionicSideMenuDelegate.canDragContent(false)
    $scope.accessToken = storage.getCurrentUser().access_token
    $scope.webappUrl = AppConfig.webapp_url
]