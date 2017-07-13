App.controller "GroupTemplatesListCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'ewpService'
  (
    $scope
    $state
    Restangular
    ewpService
  ) ->

    initialize = ->
      $scope.groupId = $state.params.groupId
      Restangular
        .one('client_groups', $scope.groupId)
        .get().then (group) ->
          $scope.group = group

      initList($state.params.templateType)

    initList = (type) ->
      param = {
        'workout-templates':
          getter: -> ewpService.getGroupWorkouts($scope.groupId).$object
          state: 'app.workoutFolderTemplate'
          stateParam: 'workoutId'
          type: 'workouts'
          folderType: 'workout-templates-folder'
        'program-templates':
          getter: -> ewpService.getGroupPrograms($scope.groupId).$object
          state: 'app.programFolderTemplate'
          stateParam: 'programId'
          type: 'programs'
          folderType: 'program-templates-folder'
      }[type]

      $scope.items = param.getter()
      $scope.itemsType = param.type
      $scope.itemsIcon = "gc-icon-#{param.type}"

      $scope.goToItem = (item) ->
        stateHash =
          templateType: param.folderType
          folderId: item.folder_id
        stateHash[param.stateParam] = item.id
        $state.go(param.state, stateHash)

    initialize()
]