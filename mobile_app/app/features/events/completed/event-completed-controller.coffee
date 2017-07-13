App.controller "EventCompletedCtrl", [
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
      Restangular
        .one('personal_workouts', $state.params.workoutId)
        .get().then (workout) ->
          $scope.workoutName = workout.name

    currentUser = storage.getCurrentUser().user_data
    $scope.userId = $state.params.userId
    $scope.workoutId = $state.params.workoutId

    $scope.goToPersonalWorkout = ->
      if currentUser.is_pro
        $state.go 'app.personalWorkout',
          userId: $scope.userId
          workoutId: $state.params.workoutId
      else
        $state.go 'app.clientPersonalWorkout',
          userId: $scope.userId
          workoutId: $state.params.workoutId

    $scope.exitToDashboard = ->
      if currentUser.is_pro
        $state.go 'app.proDashboard'
      else
        $state.go 'app.clientDashboard'

    initialize()
]