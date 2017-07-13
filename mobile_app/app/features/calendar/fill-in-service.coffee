App.factory 'calendarFillInService', [
  '$rootScope'
  '$ionicScrollDelegate'
  '$stateParams'
  'sharedData'
  'notificationsService'
  (
    $rootScope
    $ionicScrollDelegate
    $stateParams
    sharedData
    notificationsService
  ) ->

    buildCalendar: (dataEvents, myDate)->
      dataEvents = dataEvents ?= []
      eventToShow
      weeks = []
      week = []
      for date in [1..myDate.daysInMonth()]
        events = []
        for scheduleDay in dataEvents
          if scheduleDay.date is date and _.some(scheduleDay.events)
            events = scheduleDay.events
        day = moment(myDate).date(date)
        if date is 1
          week.push {day: date, week: day.week(), events: events}
          continue
        lastWeek = week[week.length - 1].week
        if lastWeek is day.week()
          week.push {day: date, week: day.week(), events: events}
        else
          weeks.push week
          week = []
          week.push {day: date, week: day.week(), events: events}
        if date is myDate.daysInMonth()
            weeks.push week

      firstWeek = weeks[0]
      if firstWeek.length < 7
        maxDay = myDate.clone().subtract(1, 'month').daysInMonth()
        for i in [1..7 - firstWeek.length]
          firstWeek.unshift {day: maxDay, otherMonth: true}
          maxDay -= 1

      lastWeek = weeks[weeks.length-1]
      if lastWeek.length < 7
        maxDay = myDate.daysInMonth()
        for i in [1..7 - lastWeek.length]
          lastDay = weeks[weeks.length-1][lastWeek.length-1].day
          if lastDay + 1 >= maxDay
            newDay = 1
          else
            newDay = lastDay += 1
          lastWeek.push {day: newDay, otherMonth: true}

      $ionicScrollDelegate.resize()
      $rootScope.$broadcast "loading:hide"

      for event in dataEvents
        if event.date is moment(myDate).date() and
        event.week is moment(myDate).week()
          event.day = event.date
          eventToShow = event

      result =
        weeks: weeks
        event: eventToShow
  ]