App.controller "PersonalExerciseCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  '$q'
  'convertPropertiesService'
  (
    $scope
    $state
    storage
    Restangular
    $q
    convertPropertiesService
  ) ->

    initialize = ->
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      Restangular
        .one('exercises', $state.params.exerciseId)
        .get()
        .then (exercise) ->
          $scope.exercise = exercise
          if not exercise.description and not exercise.video_url
            $scope.isEmpty = true

      Restangular
        .one('exercises', $state.params.exerciseId)
        .one('personal_best', $state.params.userId)
        .get()
        .then (bestResults) ->
          for result in bestResults
            for item in result.exercise_result_items
              convertPropertiesService.getOneResult(item)
          $scope.bestResults = bestResults

    initialize()
]