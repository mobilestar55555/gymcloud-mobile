App.controller "ProgramCtrl", [
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

    itemType = null

    initialize = ->
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      itemType = {
        'app.programTemplate': 'program_templates',
        'app.programFolderTemplate': 'program_templates',
        'app.personalProgram': 'personal_programs',
        'app.clientPersonalProgram': 'personal_programs'
      }[$state.current.name]

      fetchProgram()

    fetchProgram = ->
      Restangular
        .one(itemType, $state.params.programId)
        .get(nested: false).then (program) ->
          $scope.program = program
          fetchProgramWeeks()
          fetchProgramWorkouts()

    fetchProgramWeeks = ->
      Restangular
        .one(itemType, $state.params.programId)
        .one('program_weeks')
        .get().then (weeks) ->
          $scope.program.weeks = weeks

    fetchProgramWorkouts = ->
      Restangular
        .one(itemType, $state.params.programId)
        .one('program_workouts')
        .get().then (workouts) ->
          $scope.program.workouts = workouts
          $scope.isEmpty = checkIfEmpty()

    $scope.goToWorkout = (workoutId) ->
      if itemType is 'personal_programs'
        $state.go 'app.personalProgramWorkout',
          userId: $state.params.userId
          programId: $state.params.programId
          workoutId: workoutId
      else
        $state.go 'app.programTemplateOverview',
          programId: $state.params.programId
          workoutId: workoutId

    checkIfEmpty = ->
      not $scope.program.description and
      not $scope.program.notes and
      $scope.program.workouts.length == 0

    initialize()
]