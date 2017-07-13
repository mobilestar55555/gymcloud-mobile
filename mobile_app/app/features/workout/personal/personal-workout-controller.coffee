App.controller "PersonalWorkoutCtrl", [
  '$rootScope'
  '$scope'
  '$state'
  'storage'
  'Restangular'
  '$q'
  'convertPropertiesService'
  (
    $rootScope
    $scope
    $state
    storage
    Restangular
    $q
    convertPropertiesService
  ) ->
    console.log 'perswork'

    $rootScope.$on '$stateChangeStart', (event, toState, toParams, fromState, fromParams) ->
      if toState.name is 'app.personalWorkoutEventResults'
        $rootScope.$broadcast('showNotificationIcon')

    initialize = ->
      $scope.videoIsVisible = false
      $scope.userId = $state.params.userId

      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      fetchWorkout()

    fetchWorkout = ->
      Restangular
        .one('personal_workouts', $state.params.workoutId)
        .get().then (workout) ->
          convertPropertiesService.get(workout)
          $scope.workout = workout

          fetchWarmup(workout.warmup_id) if workout.warmup_id

          if not workout.description and
          not workout.note and
          workout.exercises.length is 0
            $scope.isEmpty = true


    fetchWarmup = (id) ->
      Restangular
        .one('personal_workouts', id)
        .get().then (warmup) ->
          $scope.warmup = warmup

    $scope.switchVideo = ->
      $scope.videoIsVisible = !$scope.videoIsVisible

    $scope.goToExercise = (exercise) ->
      $state.go 'app.workoutExercise',
        userId: $scope.userId
        exerciseId: exercise.id

    $scope.createEvent = ->
      diff = 30 - moment().minute()
      diff = 30 + diff if diff < 0
      start = moment().add(diff, 'minutes').format()
      end = moment(start).add(1, 'hours').format()

      newEvent =
        personal_workout_id: $state.params.workoutId
        begins_at: start
        ends_at: end

      Restangular
        .all('workout_events')
        .post(newEvent)
        .then (event) ->
          $state.go 'app.personalWorkoutEventResults',
            userId: $scope.userId
            workoutId: $state.params.workoutId
            eventId: event.id

    $scope.goToWarmupOverview = ->
      $state.go 'app.personalWorkout',
        userId: $scope.userId
        workoutId: $scope.warmup.id

    # Used for nav buttons for program-workout page

    getProgram = ->
      Restangular
        .one('personal_programs', $scope.programId)
        .get().then (program) ->
          createWorkoutsIndexesArray(program.workouts)
          getWorkoutIndex()

    createWorkoutsIndexesArray = (workouts) ->
      for key, value of workouts
        $scope.workoutsIds.idsArray[key] = value.workout_id

    getWorkoutIndex = ->
      index = $scope.workoutsIds.idsArray.indexOf +$state.params.workoutId
      if index > 0
        $scope.workoutsIds.prevWorkoutId = $scope.workoutsIds.idsArray[index - 1]
      if index < $scope.workoutsIds.idsArray.length - 1
        $scope.workoutsIds.nextWorkoutId = $scope.workoutsIds.idsArray[index + 1]

    if $state.params.programId
      $scope.programId = $state.params.programId

      $scope.workoutsIds =
        idsArray: []
        prevWorkoutId: false
        nextWorkoutId: false

      getProgram()

    # end

    initialize()
]