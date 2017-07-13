App.factory 'ewpService', [
  'Restangular'
  'storage'
  (
    Restangular
    storage
  ) ->

    getExercises: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/workout_exercises')
        .getList()

    getWorkoutTemplates: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/workout_templates')
        .getList()

    getProgramTemplates: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/program_templates')
        .getList()

    getPersonalExercises: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/personal_exercises')
        .getList()

    getPersonalWarmups: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/personal_warmups')
        .getList()

    getPersonalWorkouts: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/personal_workouts')
        .getList()

    getPersonalPrograms: (user_id) ->
      Restangular
        .one('users', user_id)
        .one('collections/personal_programs')
        .getList()

    getGroupWorkouts: (group_id) ->
      Restangular
        .one('client_groups', group_id)
        .one('assignments/workout_templates')
        .getList()

    getGroupPrograms: (group_id) ->
      Restangular
        .one('client_groups', group_id)
        .one('assignments/program_templates')
        .getList()

    getGroupClients: (group_id) ->
      Restangular
        .one('client_groups', group_id)
        .one('members')
        .getList()
]