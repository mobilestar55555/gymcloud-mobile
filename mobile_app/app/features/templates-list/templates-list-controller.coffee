App.controller "TemplatesListCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  '$q'
  (
    $scope
    $rootScope
    $state
    storage
    $q
  ) ->

    state = null
    stateParam = null

    initialize = ->
      $scope.icon = null
      $q.when(storage.getUserName()).then (name) ->
        $scope.userName = name
        $scope.currentFolder = _.find($rootScope.library, ['id', +$state.params.folderId])
        $scope.newTemplateType = _.first($state.params.templateType.split('-'))

        iconType = _.last($scope.currentFolder.icon.split('-'))
        $scope.icon = "gc-icon-#{iconType}s"
        state = "app.#{$scope.newTemplateType}FolderTemplate"
        stateParam = "#{$scope.newTemplateType}Id"

    $scope.goToItem = (item) ->
      if item.isFolder
        $state.go 'app.templatesList',
          templateType: $state.params.templateType
          folderId: item.id
      else
        stateHash = {
          templateType: $state.params.templateType
          folderId: item.id
        }
        stateHash[stateParam] = item.id
        $state.go(state, stateHash)

    initialize()
]