App.controller "NotificationsCtrl", [
  '$rootScope'
  '$scope'
  '$q'
  'notificationsService'
  '$cable'
  (
    $rootScope
    $scope
    $q
    notificationsService
    $cable
  ) ->

    $rootScope.notificationsCount = 0

    $scope.getNotifications = ->
      $q.when(notificationsService.getNotifications(25)).then (result) ->
        $scope.notifications = result.notifications

    $scope.goToNotification = (notification) ->
      notificationsService.goToNotification(notification)

    $scope.getNotifications()
]