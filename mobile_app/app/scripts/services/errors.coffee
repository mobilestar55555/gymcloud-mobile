App.factory 'errorsService', [
  '$ionicPopup'
  (
    $ionicPopup
  ) ->

    errorAlert: (error, description) ->
      $ionicPopup.alert(
        title: error
        template: description
      )
]