App.factory 'certUpload', [
  '$state'
  'storage'
  'Restangular'
  'Upload'
  (
    $state
    storage
    Restangular
    Upload
  ) ->

    user = storage.getCurrentUser()

    updateUser = ->
      Restangular
        .one('users', 'me')
        .get()
        .then (result) ->
          user.user_data = result
          storage.setKey 'user', user

    upload: (file) ->
      access_token = storage.getCurrentUser().access_token
      Upload.upload(
        url: "#{AppConfig.backend_url}/certificates"
        data:
          file: file
        method: 'POST'
        headers:
          'Authorization': "Bearer #{access_token}"
      ).then (resp) ->
        updateUser()
        $state.go('app.certUploaded')
]