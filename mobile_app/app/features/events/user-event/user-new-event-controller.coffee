App.controller "UserNewEventCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  'Restangular'
  '$q'
  '$cordovaDatePicker'
  'sharedData'
  '$ionicHistory'
  '$ionicLoading'
  '$timeout'
  (
    $scope
    $rootScope
    $state
    storage
    Restangular
    $q
    $cordovaDatePicker
    sharedData
    $ionicHistory
    $ionicLoading
    $timeout
  ) ->

    initialize = ->
      $scope.currentUser = storage.getCurrentUser()
      sharedEventDate = sharedData.getEventDate()
      selectedDate = if sharedEventDate
          moment(sharedEventDate).hour(moment().hour())
            .minute(moment().minutes())
        else
          moment()
      $scope.startDate = selectedDate.clone().toDate()
      $scope.endDate = selectedDate.clone().add(1, 'h').toDate()

      Restangular
        .one('users', $state.params.userId)
        .get().then (user) ->
          $scope.userName = "#{user.user_profile.first_name} #{user.user_profile.last_name}"
          $scope.workoutsList =
            Restangular
              .one('users', $state.params.userId)
              .one("collections/personal_workouts")
              .getList().$object

    $scope.setEndTime = (date) ->
      $scope.endDate = moment(date).add(1, 'h').toDate()

    $scope.goBack = ->
      $ionicHistory.goBack()
      cordova.plugins.Keyboard.close() if cordova?

    $scope.saveSchedule = (workoutId, start, end) ->
      daysDiff = if start > end
        moment(start).diff(moment().startOf('day'), 'days')
      else
        moment(start).diff(moment().endOf('day'), 'days')

      start = moment(start).format()
      end = moment(end).add(daysDiff, 'days').format()

      newEvent =
        personal_workout_id: workoutId
        begins_at: start
        ends_at: end

      Restangular
        .all('workout_events')
        .post(newEvent)
        .then (event) ->
          $timeout (->
            $ionicLoading.show
              template: 'Event created'
              duration: 3000
          ), 1000
          $rootScope.dateToShow = moment(start)
          if $scope.currentUser.user_data.is_pro
            $state.go 'app.clientCalendar',
              userId: $state.params.userId
          else
            $state.go 'app.ownCalendar',
              userId: $state.params.userId

    initialize()
]
