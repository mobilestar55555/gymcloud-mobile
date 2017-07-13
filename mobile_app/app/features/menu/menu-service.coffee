App.factory 'menuService', [
  'Restangular'
  'storage'
  (
    Restangular
    storage
  ) ->

    getData: () ->
      user_id = storage.getCurrentUser().user_data.id
      Restangular
        .one('users', user_id)
        .one('collections/library')
        .getList()
]