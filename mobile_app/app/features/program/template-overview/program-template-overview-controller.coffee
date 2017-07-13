App.controller "ProgramTemplateOverviewCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  (
    $scope
    $state
    storage
    Restangular
  ) ->

    initialize = ->
      $scope.videoIsVisible = false
      Restangular
      .one('program_templates', $scope.programId)
      .get().then (program) ->
        $scope.programName = program.name
        createWorkoutsIndexesArray(program.workouts)
        fetchWorkoutIndex()
        fetchCurrentWorkout()

    $scope.programId = $state.params.programId
    $scope.workoutsIds =
      idsArray: []
      prevWorkoutId: false
      nextWorkoutId: false

    $scope.switchVideo = ->
      $scope.videoIsVisible = !$scope.videoIsVisible

    createWorkoutsIndexesArray = (workouts) ->
      for key, value of workouts
        $scope.workoutsIds.idsArray[key] = value.workout_id

    fetchCurrentWorkout = ->
      Restangular
        .one('workout_templates', $state.params.workoutId)
        .get().then (workout) ->
          $scope.workout = workout

          fetchWarmup(workout.warmup_id) if workout.warmup_id

          if not workout.description and
          not workout.notes and
          workout.exercises.length is 0
            $scope.isEmpty = true

    fetchWarmup = (id) ->
      Restangular
        .one('workout_templates', id)
        .get().then (warmup) ->
          $scope.warmup = warmup

    fetchWorkoutIndex = ->
      index = $scope.workoutsIds.idsArray.indexOf +$state.params.workoutId
      if index > 0
        $scope.workoutsIds.prevWorkoutId = $scope.workoutsIds.idsArray[index - 1]
      if index < $scope.workoutsIds.idsArray.length - 1
        $scope.workoutsIds.nextWorkoutId = $scope.workoutsIds.idsArray[index + 1]

    $scope.goToExercise = (exercise) ->
      $state.go 'app.workoutTemplateExercise',
        workoutId: $state.params.workoutId
        exerciseId: exercise.exercise_id

    $scope.goToWarmupOverview = ->
      $state.go 'app.workoutTemplateWarmups',
        workoutId: $scope.warmup.id

    initialize()
]