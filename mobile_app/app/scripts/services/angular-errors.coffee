App.factory '$exceptionHandler', ->
  (exception, cause) ->
    console.error(exception)
    alert(exception)