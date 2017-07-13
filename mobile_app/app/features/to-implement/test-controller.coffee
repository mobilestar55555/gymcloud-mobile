App.controller "TestCtrl", [
  '$scope'
  (
    $scope
  ) ->

    initialize = ->
      # If use $scope - then data is accessible in template
      $scope.userData = {
        user1:
          name: 'User 1',
          avatar: 'img/avatar.png'
        user2:
          name: 'User 2',
          avatar: 'img/avatar.png'
        user3:
          name: 'User 3',
          avatar: 'img/avatar.png'
      }

    initialize()
]