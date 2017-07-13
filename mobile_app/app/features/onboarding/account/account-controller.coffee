App.controller "OnboardingAccountCtrl", [
  '$scope'
  '$state'
  'Restangular'
  'storage'
  (
    $scope
    $state
    Restangular
    storage
  ) ->

    initialize = ->
      Restangular
        .one('user_account_types')
        .getList()
        .then (accountTypes) ->
          $scope.accountTypes = accountTypes
          $scope.selectedType = 1

    $scope.selectType = (selectedType) ->
      id = storage.getCurrentUser().user_data.user_settings?.id

      method = if id
        Restangular.one('user_settings', id).patch
      else
        Restangular.one('user_settings').post

      method(user_account_type_id: selectedType)
        .then ->
          $state.go 'app.onboardingPrograms'

    initialize()
]