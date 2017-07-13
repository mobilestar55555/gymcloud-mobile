App.controller "ResultsWorkoutOverviewCtrl", [
  '$rootScope'
  '$scope'
  '$state'
  'storage'
  'Restangular'
  'convertPropertiesService'
  '$q'
  (
    $rootScope
    $scope
    $state
    storage
    Restangular
    convertPropertiesService
    $q
  ) ->

    initialize = ->
      $scope.userId = $state.params.userId
      personalWorkoutId = $state.params.workoutId
      $scope.videoIsVisible = false

      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      Restangular
        .one('personal_workouts', $state.params.workoutId)
        .get().then (workout) ->
          convertPropertiesService.get(workout)
          $scope.workout = workout
          if not workout.description and not workout.note and workout.exercises.length is 0
            $scope.isEmpty = true

    $rootScope.$on '$stateChangeStart', (event, toState, toParams, fromState, fromParams) ->
      if toState.name is 'app.personalWorkoutEventResults'
        $rootScope.$broadcast('showNotificationIcon')

    $scope.switchVideo = ->
      $scope.videoIsVisible = !$scope.videoIsVisible

    initialize()
]