App.controller "WorkoutTemplateCtrl", [
  '$scope'
  'storage'
  'Restangular'
  '$state'
  '$q'
  'convertPropertiesService'
  (
    $scope
    storage
    Restangular
    $state
    $q
    convertPropertiesService
  ) ->

    initialize = ->
      $scope.videoIsVisible = false
      $q.when(storage.getUserName()).then (result) ->
        $scope.userName = result

      fetchWorkout()

    fetchWorkout = ->
      Restangular
        .one('workout_templates', $state.params.workoutId)
        .get().then (workout) ->
          convertPropertiesService.get(workout)
          $scope.workout = workout
          fetchWarmup(workout.warmup_id) if workout.warmup_id

          $scope.templateType = if workout.is_warmup
              'warmup'
            else
              'workout'

          if not workout.description and
          not workout.note and
          not workout.video_url and
          workout.exercises.length == 0
            $scope.isEmpty = true

    fetchWarmup = (id) ->
      Restangular
        .one('workout_templates', id)
        .get().then (warmup) ->
          $scope.warmup = warmup

    $scope.goToExercise = (exercise) ->
      $state.go 'app.workoutTemplateExercise',
        workoutId: $scope.workout.id
        exerciseId: exercise.exercise_id

    $scope.goToWarmupOverview = ->
      $state.go 'app.workoutTemplateWarmups',
        workoutId: $scope.warmup.id

    $scope.switchVideo = ->
      $scope.videoIsVisible = !$scope.videoIsVisible

    initialize()
]
