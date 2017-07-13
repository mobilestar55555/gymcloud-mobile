App.factory 'urlInterceptionService', [
  '$rootScope'
  '$state'
  'Restangular'
  'queryParamsParserService'
  'sharedData'
  'storage'
  'notificationsService'
  (
    $rootScope
    $state
    Restangular
    queryParamsParserService
    sharedData
    storage
    notificationsService
  ) ->

    redirect: (url) ->
      stateRegex = /#[a-z_]+/i
      numberRegex = /[0-9-]+/
      route = stateRegex.exec(url)
      return false unless route
      switch route[0]
        when '#signup'
          $rootScope.invitationParams = queryParamsParserService.queryString(url)
          $state.go('signUp')
        when '#reset'
          $rootScope.resetPasswordToken = _.last(url.split('/'))
          $state.go('resetPassword')
        when '#calendar'
          date = numberRegex.exec(url)
          date = moment(date[0]).format()
          $state.go 'app.ownCalendar', {
            userId: storage.getCurrentUser().user_data.id
            date: date
          }, reload: true
        when '#personal_workouts'
          id = numberRegex.exec(url)
          Restangular
            .one('personal_workouts', id)
            .get()
            .then (workout) ->
              $state.go 'app.personalWorkout',
                userId: workout.person_id
                workoutId: workout.id
        when '#personal_programs'
          id = numberRegex.exec(url)
          Restangular
            .one('personal_programs', id)
            .get()
            .then (program) ->
              $state.go 'app.personalProgram',
                userId: program.person_id
                programId: program.id
        when '#events'
          isComments = _.last(url.split('/')) is 'comments'
          notificationsService.setCommentState() if isComments
          id = numberRegex.exec(url)
          Restangular
            .one('workout_events', id)
            .get()
            .then (event) ->
              $state.go 'app.personalWorkoutEventResults',
                userId: event.person_id
                workoutId: event.personal_workout_id
                eventId: event.id
        else
          return false

    redirectWeb: ->
      regex = /[a-z]+/i
      match = regex.exec(window.location.hash)
      return false unless match
      switch match[0]
        when 'signup'
          $rootScope.invitationParams = queryParamsParserService
            .queryString(window.location.hash)
        else
          return
]