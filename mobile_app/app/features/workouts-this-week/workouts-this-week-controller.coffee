App.controller 'WorkoutsThisWeekCtrl', [
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

    $scope.initialize = ->
      user = storage.getCurrentUser().user_data
      $scope.today = moment().format('YYYY-MM-DD')
      params =
        scope: 'all_with_clients'
        range_from: moment().weekday(0).hour(0).minute(1).format('YYYY-MM-DD HH:mm:ss')
        range_to: moment().weekday(6).hour(23).minute(59).format('YYYY-MM-DD HH:mm:ss')
      Restangular
        .one('users', user.id)
        .all('collections/workout_events')
        .getList(params)
        .then (events) ->
          for event in events
            event.date = moment(event.begins_at).format('YYYY-MM-DD')
          $scope.events = events

          $scope.isEmpty = !events.length

    $scope.isPast = (event) ->
      event.date < $scope.today

    $scope.isFuture = (event) ->
      event.date >= $scope.today

    $scope.initialize()
]
