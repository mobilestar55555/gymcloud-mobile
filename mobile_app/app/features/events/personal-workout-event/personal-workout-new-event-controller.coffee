App.controller "PersonalWorkoutNewEventCtrl", [
  '$scope'
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
      $q.when(storage.getUserName()).then (result) ->
        $scope.userName = result

      $scope.workout = Restangular
        .one('personal_workouts', $state.params.workoutId)
        .get().$object

      Restangular
        .one('users', $state.params.userId)
        .get().then (user) ->
          user_is_pro = user.is_pro

    currentUser = storage.getCurrentUser().user_data
    personalWorkoutId = $state.params.workoutId
    user_is_pro = null
    $scope.startDate = moment().toDate()
    $scope.endDate = moment().add(1, 'h').toDate()

    $scope.goBack = ->
      $ionicHistory.goBack()
      cordova.plugins.Keyboard.close() if cordova?

    $scope.setEndTime = (date) ->
      $scope.endDate = moment(date).add(1, 'h').toDate()

    $scope.saveSchedule = (start, end)->
      daysDiff = if start > end
        moment(start).diff(moment().startOf('day'), 'days')
      else
        moment(start).diff(moment().endOf('day'), 'days')

      start = moment(start).format()
      end = moment(end).add(daysDiff, 'days').format()

      newEvent =
        personal_workout_id: personalWorkoutId
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
          sharedData.setEventDate(start)
          if user_is_pro or
          !user_is_pro and currentUser.id isnt $state.params.userId
            $state.go 'app.ownCalendar',
              userId: $state.params.userId
          else
            $state.go 'app.clientCalendar',
              userId: $state.params.userId

    initialize()
]
