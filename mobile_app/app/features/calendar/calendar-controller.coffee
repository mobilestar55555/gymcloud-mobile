App.controller "CalendarCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  'calendarEventsService'
  'calendarFillInService'
  '$ionicScrollDelegate'
  'Restangular'
  '$q'
  'sharedData'
  (
    $scope
    $rootScope
    $state
    storage
    calendarEventsService
    calendarFillInService
    $ionicScrollDelegate
    Restangular
    $q
    sharedData
  ) ->

    $q.when(storage.getUserName()).then (result) ->
      $scope.userName = result

    currentUser = storage.getCurrentUser().user_data
    $scope.userId = +$state.params.userId
    $scope.title = 'calendar'
    dateToShow = $rootScope.dateToShow || moment()
    monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]
    $scope.previous = $state.previous
    $scope.eventsToShow = false

    if $state.current.name is 'app.ownCalendar' and currentUser.is_pro
      $scope.isTrainerCalendar = true

    updateDateTitles = ->
      $scope.year = dateToShow.year()
      $scope.month = monthNames[dateToShow.month()]

    $scope.showEvents = (day) ->
      if day.otherMonth
        if day.day < 7
          $scope.nextMonth()
        else
          $scope.prevMonth()
      else
        if day.events.length
          $scope.eventsToShow = day.events
        else
          $scope.eventsToShow = []
        $ionicScrollDelegate.resize()
        $scope.selectedDay = day

    $scope.nextMonth = ->
      dateToShow.add(1, 'month')
      updateDateTitles()
      getEvents()

    $scope.prevMonth = ->
      dateToShow.subtract(1, 'month')
      updateDateTitles()
      getEvents()

    getEvents = ->
      updateDateTitles()
      $rootScope.$broadcast "loading:show"
      $scope.eventsToShow = []
      month = dateToShow.month() + 1
      $q.when(calendarEventsService.prepare($scope.userId, $scope.year, month)).then (events) =>
        $q.when(calendarFillInService.buildCalendar(events, dateToShow)).then (result) =>
          $scope.weeks = result.weeks
          $scope.showEvents(result.event)

    $scope.goToEvent = (event) ->
      options =
        userId: event.person_id
        workoutId: event.personal_workout_id
        eventId: event.id

      if event.is_completed
        $state.go 'app.resultsSummary', options
      else
        $state.go 'app.personalWorkoutEventResults', options

    $scope.userNewEvent = ->
      date = moment($scope.selectedDay)
      date.month(dateToShow.month())
      sharedData.setEventDate(date.format())
      $state.go 'app.userNewEvent',
        userId: $scope.userId

    $scope.deleteEvent = (id, index) ->
      Restangular
        .one('workout_events', id)
        .remove().then ->
          $scope.eventsToShow.splice(index, 1)

    getEvents()
]