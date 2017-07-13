App.controller "UserProfileCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  'ewpService'
  (
    $scope
    $state
    storage
    Restangular
    ewpService
  ) ->

    $scope.userId = $state.params.userId or storage.getCurrentUser().user_data.id
    # Check to hide on my training log
    $scope.user_is_pro = !$state.params.userId?
    $scope.initialize = ->
      Restangular
        .one('users', $scope.userId)
        .get().then (user) ->
          $scope.user = user
          if user.user_profile.height
            $scope.userHeight =
              feets: Math.floor(+user.user_profile.height/12)
              inches: +user.user_profile.height%12

      ewpService.getPersonalExercises($scope.userId).then (exercises) ->
        $scope.exercisesCount = exercises.length

      ewpService.getPersonalWarmups($scope.userId).then (warmups) ->
        $scope.warmupsCount = warmups.length

      ewpService.getPersonalWorkouts($scope.userId).then (workouts) ->
        countWorkouts(workouts)

      ewpService.getPersonalPrograms($scope.userId).then (programs) ->
        $scope.programsCount = programs.length

    countWorkouts = (workouts) ->
      $scope.programWorkoutsCount = 0
      $scope.personalWorkoutsCount = 0
      for workout in workouts
        if workout.is_program_part
          $scope.programWorkoutsCount++
        else
          $scope.personalWorkoutsCount++

    $scope.calculateAge = (birthday) ->
      if birthday?
        moment().diff(birthday, 'years')

    $scope.navigateToCalendar = ->
      if $scope.user.is_pro and $state.current.name isnt 'app.myTraining'
        $state.go 'app.ownCalendar',
          userId: $scope.userId
      else
        $state.go 'app.clientCalendar',
          userId: $scope.userId

    $scope.initialize()
]