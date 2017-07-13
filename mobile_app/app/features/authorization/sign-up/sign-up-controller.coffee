App.controller "SignUpCtrl", [
  '$rootScope'
  '$scope'
  '$state'
  '$http'
  'storage'
  'authService'
  'socialLoginService'
  'Restangular'
  'authCallback'
  (
    $rootScope
    $scope
    $state
    $http
    storage
    authService
    socialLoginService
    Restangular
    authCallback
  ) ->

    $scope.showAccountSelect = true
    $scope.user = $rootScope.invitationParams or {}
    if $rootScope.invitationParams?.is_pro is 'true'
      $scope.user.is_client = false
    else if $rootScope.invitationParams?.is_pro is 'false'
      $scope.user.is_client = true

    $scope.changeViews = ->
      return false unless $scope.user.is_client?
      $scope.showAccountSelect = !$scope.showAccountSelect

    user = {}
    $scope.eulaIsChecked = false

    $scope.checkEula = ->
      $scope.eulaIsChecked = !$scope.eulaIsChecked

    $scope._goToDashboard = (user) ->
      if user.is_pro
        $state.go 'app.proDashboard'
      else
        $state.go 'app.clientDashboard'

    loginUser = (clientInvited = false) ->
      user =
        username: $scope.user.email
        password: $scope.user.password

      authService.login(user).then ->
        if $scope.user.is_client and not clientInvited
          Restangular
            .all('pros/request')
            .post()
            .then (result) ->
              $state.go 'proRequestSent'
        else
          $scope.getUserInfo()
          user = storage.getCurrentUser()
          $rootScope.$broadcast('userLoggedIn')

    $scope.getUserInfo = ->
      Restangular
        .one('users/me')
        .get()
        .then(_.bind(authCallback.fn, authCallback, $scope))

    $scope.signUp = (user) ->
      return false unless $scope.eulaIsChecked
      if $rootScope.invitationParams
        acceptInvitation(user)
      else
        signUp(user)

    acceptInvitation = (user) ->
      request =
        method: 'PUT'
        url: "#{AppConfig.backend_url}/users/invitation.json"
        data:
          user: user

      $http(request).then ->
        if user.is_pro is 'true'
          loginUser()
        else
          loginUser(true)

    signUp = (user) ->
      Restangular
        .all('users')
        .post(user: user)
        .then (data) ->
          updateUserProfile(data.user_profile.id, user)

    updateUserProfile = (id, user) ->
      userData =
        username: user.email
        password: user.password

      authService.login(userData).then ->
        data =
          first_name: user.first_name
          last_name: user.last_name
        Restangular
          .one('user_profiles', id)
          .patch(data)
          .then (res) ->
            loginUser()

    $scope.googleLogin = ->
      socialLoginService.googleLogin(true)

    $scope.facebookLogin = ->
      socialLoginService.facebookLogin(true)
]