App.directive 'browseTo', ($ionicGesture) ->
  restrict: 'A'
  link: ($scope, $element, $attrs) ->
    handleTap = (e) ->
      window.open(encodeURI($attrs.browseTo), '_system')
    tapGesture = $ionicGesture.on('tap', handleTap, $element)
    $scope.$on '$destroy', ->
      $ionicGesture.off tapGesture, 'tap', handleTap