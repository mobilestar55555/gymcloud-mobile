App.directive 'onlyDigits', ->
  require: 'ngModel'
  link: (scope, element, attrs, modelCtrl) ->
    modelCtrl.$parsers.push (inputValue) ->
      transformedInput = inputValue.toLowerCase().replace(/[^0-9.]/g, '')
      if transformedInput != inputValue
        modelCtrl.$setViewValue transformedInput
        modelCtrl.$render()
      transformedInput