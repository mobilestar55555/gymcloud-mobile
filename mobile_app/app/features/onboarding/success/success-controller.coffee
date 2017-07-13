App.controller "OnboardingSuccessCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'Restangular'
  'storage'
  (
    $scope
    $rootScope
    $state
    Restangular
    storage
  ) ->

    user_settings = storage.getCurrentUser().user_data.user_settings

    $scope.finishOnboarding = ->
      Restangular
        .one('user_settings', user_settings.id)
        .patch(is_presets_loaded: true)
        .then ->
          $rootScope.$broadcast('onboardingFinished')

          if user_settings.is_mobile_tutorial_finished
            $state.go 'app.proDashboard'
          else
            $state.go 'app.tutorial'
]