App.controller "TutorialsCtrl", [
  '$scope'
  '$state'
  'storage'
  'Restangular'
  'slideContent'
  (
    $scope
    $state
    storage
    Restangular
    slideContent
  ) ->

    initialize = ->
      $scope.options =
        loop: false
        effect: 'fade'
        speed: 500
        nextButton: '.gc-submit-btn'

      $scope.user = storage.getCurrentUser().user_data
      $scope.tutorial = if $scope.user.is_pro
        slideContent.pro()
      else
        slideContent.client()

    $scope.$on '$ionicSlides.sliderInitialized', (event, data) ->
      $scope.slider = data.slider

    $scope.finishTutorial = ->
      Restangular
        .one('user_settings', $scope.user.user_settings.id)
        .patch(is_mobile_tutorial_finished: true)
        .then ->
          if $scope.user.is_pro
            $state.go 'app.proDashboard'
          else
            $state.go 'app.clientDashboard'

    $scope.nextSlide = ->
      $scope.finishTutorial() if $scope.slider.isEnd

    initialize()
]