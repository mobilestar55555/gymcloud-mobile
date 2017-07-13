App.factory 'sharedData', ->

  newEventDate = null

  setEventDate: (date) ->
    newEventDate = date

  getEventDate: ->
    dateToReturn = newEventDate
    newEventDate = null
    dateToReturn