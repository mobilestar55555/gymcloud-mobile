App.controller "CertUploadedCtrl", [
  '$scope'
  '$state'
  'storage'
  (
    $scope
    $state
    storage
  ) ->

    user = storage.getCurrentUser()

    $scope.redirect = ->
      if not user.user_data.user_settings.is_presets_loaded
        $state.go 'app.onboardingAccount'
      else
        $state.go 'app.proDashboard'
]