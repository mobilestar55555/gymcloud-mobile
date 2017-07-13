App.factory 'proNavigationService', [
  '$state'
  (
    $state
  ) ->

    goToItem: (item)->
      param = {
        'Exercises':
          route: 'exercise-templates-folder'
          state: 'app.exerciseTemplate'
          stateParam: 'exerciseId'
        'Warmup Templates':
          route: 'workout-templates-folder'
          state: 'app.workoutTemplate'
          stateParam: 'workoutId'
        'Workout Templates':
          route: 'workout-templates-folder'
          state: 'app.workoutTemplate'
          stateParam: 'workoutId'
        'Program Templates':
          route: 'program-templates-folder'
          state: 'app.programTemplate'
          stateParam: 'programId'
      }[item.type]

      if item.isFolder
        $state.go 'app.templatesList',
          templateType: param.route
          folderId: item.id
      else
        stateHash = {}
        stateHash[param.stateParam] = item.id
        $state.go(param.state, stateHash)
]