App.controller "WorkoutExerciseCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  'convertPropertiesService'
  '$q'
  (
    $scope
    $state
    storage
    Restangular
    convertPropertiesService
    $q
  ) ->

    initialize = ->
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      Restangular
        .one('workout_exercises', $state.params.exerciseId)
        .get().then (exercise) ->
          $scope.exercise = exercise
          for result in exercise.exercise_results
            if result.is_personal_best
              for item in result.exercise_result_items
                convertPropertiesService.getOneResult(item)
              $scope.bestResults.push result
          if not exercise.description and not exercise.video_url and $scope.bestResults.length is 0
            $scope.isEmpty = true

    $scope.bestResults = []

    initialize()
]