App.controller "CertCtrl", [
  '$scope'
  '$state'
  'storage'
  'certUpload'
  'authService'
  (
    $scope
    $state
    storage
    certUpload
    authService
  ) ->

    initialize = ->
      params = {
        'app.certUpload':
          title: 'Certifications'
          text: 'Please upload a photo of your personal training certification here.'
          method: ->
            storage.setKey 'cert_upload_is_skipped', true
            $state.go 'app.onboardingAccount'

        'app.certBlockedAccount':
          title: 'Certification required'
          text: 'Please upload a photo of your professional certification to continue using GymCloud.'
          method: ->
            authService.logout()

        'app.certBlockedClientsAdd':
          title: 'Certification required'
          text: 'Please upload a photo of your professional certification before adding clients to your GymCloud account.'
          method: ->
            $state.go 'app.clients'
      }[$state.current.name]

      $scope.title = params.title
      $scope.text = params.text
      $scope.skip = ->
        params.method()

    $scope.certUpload = (file) ->
      certUpload.upload(file)

    initialize()
]