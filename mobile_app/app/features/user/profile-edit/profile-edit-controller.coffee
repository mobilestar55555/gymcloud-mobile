App.controller "ProfileEditCtrl", [
  '$scope'
  '$rootScope'
  '$state'
  'storage'
  'Restangular'
  'Upload'
  'certUpload'
  (
    $scope
    $rootScope
    $state
    storage
    Restangular
    Upload
    certUpload
  ) ->

    $scope.initialize = ->
      Restangular
        .one('users/me')
        .get()
        .then (result) ->
          $scope.user = result.user_profile
          $scope.accountType = result.user_settings?.user_account_type_name
          $scope.userProfile = result.user_profile

          $scope.bodyStats = [
            {
              label: 'Weight'
              property: 'weight'
              value: +$scope.userProfile.weight
              unit: 'lbs'
            },
            {
              label: 'Height'
              property: 'height'
              feets: Math.floor(+$scope.userProfile.height/12)
              inches: +$scope.userProfile.height%12
              unit: 'ft\' in"'
            },
            {
              label: 'Bodyfat'
              property: 'bodyfat'
              value: +$scope.userProfile.bodyfat
              unit: '%'
            }
          ]

          $scope.generalInfo = [
            {
              label: 'First Name'
              property: 'first_name'
              value: $scope.userProfile.first_name
            },
            {
              label: 'Last Name'
              property: 'last_name'
              value: $scope.userProfile.last_name
            }
          ]

          $scope.birthday = {
            label: 'Birthday'
            property: 'birthday'
            value: moment($scope.userProfile.birthday).toDate()
          }

    sessionUser = storage.getCurrentUser()

    updateStoredUser = (user) ->
      sessionUser.user_data.user_profile = user
      $rootScope.$broadcast('userInfoChanged')

    $scope.uploadAvatar = (file) ->
      access_token = storage.getCurrentUser().access_token
      Upload.upload(
        url: "#{AppConfig.backend_url}/user_profiles/#{$scope.userProfile.id}/avatar"
        data:
          avatar: file
        method: 'PATCH'
        headers:
          'Authorization': "Bearer #{access_token}"
      ).then ((user) ->
        updateStoredUser(user)
        $scope.userProfile.avatar.large.url = user.data.avatar.large.url
      ), (resp) ->
        console.log 'Error status: ' + resp.status

    $scope.certUpload = (file) ->
      certUpload.upload(file)

    $scope.saveHeight = (unit, value) ->
      height = $scope.bodyStats[1]
      height[unit] = +value
      $scope.user['height'] = height['feets']*12 + height['inches']
      Restangular
        .one('user_profiles', $scope.userProfile.id)
        .patch($scope.user)
        .then (user) ->
          updateStoredUser(user)

    $scope.saveInfo = (property, value) ->
      $scope.user[property] = value
      Restangular
        .one('user_profiles', $scope.userProfile.id)
        .patch($scope.user)
        .then (user) ->
          updateStoredUser(user)

    $scope.initialize()
]