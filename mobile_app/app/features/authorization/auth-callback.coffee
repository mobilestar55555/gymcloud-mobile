App.factory 'authCallback', [
  '$rootScope'
  '$state'
  'storage'
  (
    $rootScope
    $state
    storage
  ) ->
    fn: (scope, result) ->
      user = result.user
      currentUser = storage.getCurrentUser() or {}
      currentUser.user_data = user
      storage.setKey 'user', currentUser
      # Trial is temporary disabled, commenting code to enable in future
      # certUploadIsSkipped = !!window.localStorage.cert_upload_is_skipped

      # if user.is_pro and
      # not certUploadIsSkipped and
      # not user.has_certificate
      #   $state.go('app.certUpload')
      $rootScope.$broadcast('userLoggedIn')
      if user.is_pro and
      not user.user_settings?.is_presets_loaded
        $state.go('app.onboardingAccount')
      else if user.is_pro and
      user.user_settings?.is_presets_loaded and
      not user.user_settings?.is_mobile_tutorial_finished or
      not user.is_pro and
      not user.user_settings?.is_mobile_tutorial_finished
        $state.go('app.tutorial')
      else
        scope._goToDashboard(user)
]