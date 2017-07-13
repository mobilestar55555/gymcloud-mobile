App.controller 'VideoLibraryCtrl', [
  '$scope'
  'Restangular'
  'storage'
  'Upload'
  '$ionicPopup'
  '$timeout'
  (
    $scope
    Restangular
    storage
    Upload
    $ionicPopup
    $timeout
  ) ->

    $scope.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1
    access_token = storage.getCurrentUser().access_token

    $scope.initialize = ->
      params =
        page: 1
        per_page: 25

      Restangular
        .all('videos')
        .getList(params)
        .then (result) ->
          $scope.videos = result[1]

    response = (res) ->
      error = JSON.parse(res).error
      alert(error) if error

    $scope.showPopup = ->
      confirmPopup = $ionicPopup.alert(
        title: 'Select one of the options'
        cssClass: 'select-video-popup'
        buttons: [
          {
            text: 'Take Photo or Video'
            onTap: (e) ->
              $timeout ->
                cameraInput = angular.element(document.querySelector('#open-camera'))
                cameraInput.triggerHandler('click')
          }
          {
            text: 'Photo Library'
            onTap: (e) ->
              url = "#{AppConfig.backend_url}/videos"
              window.plugins.iOSVideoUploader.getVideo(response, alert, url, access_token)
          }
          {
            text: 'Cancel'
            onTap: (e) ->
              confirmPopup.close()
          }
        ]
      )

    $scope.uploadVideo = (file) ->
      return false unless file
      Upload.upload(
        url: "#{AppConfig.backend_url}/videos"
        headers: Authorization: "Bearer #{access_token}"
        data:
          file: file
          name: file.name
        method: 'POST'
      ).success (user) ->
        $scope.initialize()

    $scope.initialize()
]