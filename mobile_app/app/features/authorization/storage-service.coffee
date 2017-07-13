App.factory 'storage', [
  '$state'
  'Restangular'
  (
    $state
    Restangular
  ) ->

    session: window.localStorage

    getCurrentUser: () ->
      if @session.user
        JSON.parse @session.user
      else
        false

    setKey: (key, value) ->
      window.localStorage.setItem(key, JSON.stringify(value))

    getUserName: () ->
      userId = $state.params.userId or this.getCurrentUser().user_data.id
      Restangular
        .one('users', userId)
        .get().then (user) ->
          name = "#{user.user_profile.first_name} #{user.user_profile.last_name}"
]