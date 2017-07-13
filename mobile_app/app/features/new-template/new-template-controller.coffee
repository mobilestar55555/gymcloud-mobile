App.controller "NewTemplateCtrl", [
  '$scope'
  '$state'
  (
    $scope
    $state
  ) ->

    initialize = ->
      $scope.templateType = $state.params.templateType

    initialize()
]