App.controller "ExerciseTemplateCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  '$q'
  (
    $scope
    $state
    storage
    Restangular
    $q
  ) ->

    initialize = ->
      $q.when(storage.getUserName()).then (result) ->
        $scope.userName = result

      Restangular
        .one('exercises', $state.params.exerciseId)
        .get().then (exercise) ->
          $scope.exercise = exercise
          if not exercise.description and not exercise.video_url
            $scope.isEmpty = true

    initialize()
]