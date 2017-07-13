App.controller "DashboardCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  '$q'
  '$ionicSlideBoxDelegate'
  'sharedData'
  'notificationsService'
  (
    $scope
    $state
    Restangular
    storage
    $q
    $ionicSlideBoxDelegate
    sharedData
    notificationsService
  ) ->

    $scope.initialize = ->
      $scope.webappUrl = AppConfig.webapp_url
      $scope.user = storage.getCurrentUser()
      $scope.diff = null

      dashboardType = if $scope.user.user_data.is_pro
        'dashboards/pro'
      else
        'dashboards/client'

      $scope.eventsDynamic = {}

      $q.when(notificationsService.getNotifications(3)).then (result) ->
        $scope.notifications = result.notifications.slice(0, 3)

      fetchDashboard(dashboardType)

    fetchDashboard = (dashboardType) ->
      Restangular
        .one(dashboardType)
        .get()
        .then (dashboard) ->
          dashboard.events_scheduled_today = _.chain(
            dashboard.events_scheduled_today
          ).sortBy('begins_at')
          .filter((ev) -> moment(ev.begins_at) > moment())
          .value()
          $scope.dashboard = dashboard
          # Complete indicator is fully filled with color when stroke-dasharray: 20 20
          # If it's 10 20, indicator filled by 50%, so this calculation is to get proper coefficient
          $scope.coefficient = 20 / dashboard.events_scheduled_this_week_count * dashboard.events_completed_this_week_count
          $ionicSlideBoxDelegate.update()
          calculateDynamic(dashboard)

    calculateDynamic = (dashboard) ->
      thisWeek = dashboard.events_scheduled_this_week_count
      lastWeek = dashboard.events_scheduled_last_week_count
      if thisWeek > lastWeek
        $scope.eventsDynamic.positive = true
      else if thisWeek < lastWeek
        $scope.eventsDynamic.negative = true
      else
        $scope.eventsDynamic.equals = true

    $scope.goToEvent = (event) ->
      $state.go 'app.personalWorkoutEventResults',
        userId: event.person_id
        workoutId: event.personal_workout_id
        eventId: event.id

    $scope.scheduleNewEvent = ->
      date = moment($scope.selectedDay).format()
      sharedData.setEventDate(date)
      $state.go 'app.userNewEvent',
        userId: $scope.user.user_data.id

    $scope.goToNotification = (notification) ->
      notificationsService.goToNotification(notification)

    $scope.initialize()
]