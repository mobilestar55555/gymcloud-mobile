App.controller "PersonalItemsListCtrl", [
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
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name

      if $state.params.personalType is 'personal-exercises'
        initList('exercise')
      else if $state.params.personalType is 'personal-warmups'
        initList('warmup')
      else if $state.params.personalType is 'personal-workouts'
        initList('workout')
      else if $state.params.personalType is 'personal-programs'
        initList('program')

    getItems = (collection) ->
      Restangular
        .one('users', $state.params.userId)
        .one("collections/#{collection}")
        .getList().then (result) ->
          $scope.items = result
          $scope.isEmpty = result.length is 0

    initList = (type) ->
      param = {
        exercise:
          collection: 'personal_exercises'
          state: 'app.personalExercise'
          stateParam: 'exerciseId'
          type: 'exercises'
        warmup:
          collection: 'personal_warmups'
          state: 'app.personalWorkout'
          stateParam: 'workoutId'
          type: 'warmups'
        workout:
          collection: 'personal_workouts'
          state: 'app.personalWorkout'
          stateParam: 'workoutId'
          type: 'workouts'
        program:
          collection: 'personal_programs'
          state: 'app.personalProgram'
          stateParam: 'programId'
          type: 'programs'
      }[type]

      $scope.itemsType = param.type
      $scope.itemsIcon = "gc-icon-#{param.type}"

      getItems(param.collection)

      $scope.goToItem = (itemId) ->
        stateHash = { userId: $state.params.userId }
        stateHash[param.stateParam] = itemId
        $state.go(param.state, stateHash)

    initialize()
]