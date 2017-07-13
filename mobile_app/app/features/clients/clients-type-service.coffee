App.factory 'clientsTypeService', [
  'storage'
  (
    storage
  ) ->

    run: (user) ->
      userType = {
        'Physical Therapist': 'Patients'
        'Coach': 'Athletes'
        'Athletic Trainer': 'Athletes'
        'Personal Trainer': 'Clients'
      }[user.user_settings?.user_account_type_name] || 'Clients'
]