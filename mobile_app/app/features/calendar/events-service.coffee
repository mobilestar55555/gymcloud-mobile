App.factory 'calendarEventsService', [
  '$state'
  'Restangular'
  'storage'
  '$q'
  (
    $state
    Restangular
    storage
    $q
  ) ->

    currentUser = storage.getCurrentUser().user_data

    getEventsScope = (year, month) ->
      date = new Date(year, month - 1, 1)
      firstDay: moment(date).startOf('month')
      lastDay: moment(date).endOf('month')

    prepareArray = (currentDay) ->
      arr = Array.apply(null, Array(35)).map -> {}

      for day in arr
        day.formatted_date = currentDay.format('YYYY-MM-DD')
        day.month = currentDay.isSame(moment(), 'month')
        day.week = currentDay.week()
        day.date = currentDay.date()
        day.today = currentDay.isSame(moment(), 'day')
        day.events = []
        currentDay = currentDay.add(1, 'day')

      arr

    fetchEvents = (userId, year, month) ->
      range = getEventsScope(year, month)
      params =
        scope: 'all'
        range_from: range.firstDay.hour(0).minute(1).format('YYYY-MM-DD HH:mm:ss')
        range_to: range.lastDay.hour(23).minute(59).format('YYYY-MM-DD HH:mm:ss')
      if userId is currentUser.id and
        currentUser.is_pro and
        $state.current.name is 'app.ownCalendar'
          params.scope = 'all_with_clients'

      Restangular
        .one('users', userId)
        .all('collections/workout_events')
        .getList(params)

    mergeEvents = (array, events) ->
      for event in events
        event_day = moment(event.begins_at)
        array_item = _.find array, (i) ->
          moment(i.formatted_date).isSame(event_day, 'day')
        if array_item
          array_item.events.push(event)
      array

    prepare: (userId, year, month) ->
      range = getEventsScope(year, month)
      array = prepareArray(range.firstDay)
      $q.when(fetchEvents(userId, year, month)).then (events) =>
        mergeEvents(array, events)
  ]