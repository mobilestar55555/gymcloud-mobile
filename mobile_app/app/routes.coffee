App.config [
  '$stateProvider'
  '$urlRouterProvider'
  'RestangularProvider'
  '$sceDelegateProvider'
  '$ionicConfigProvider'
  (
    $stateProvider
    $urlRouterProvider
    RestangularProvider
    $sceDelegateProvider
    $ionicConfigProvider
    authService
  ) ->

    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$'),
      new RegExp('^(http[s]?):\/\/(w{3}.)?player\.vimeo\.com\/.+$')
    ])
    RestangularProvider.setBaseUrl AppConfig.backend_url
    RestangularProvider.setDefaultHeaders
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    $ionicConfigProvider.backButton.previousTitleText(false).text('')
    $ionicConfigProvider.tabs.position('bottom')
    $ionicConfigProvider.scrolling.jsScrolling(true)

    $stateProvider

    .state 'app',
      url: '/app'
      abstract: true
      templateUrl: 'features/menu/menu.html'
      controller: 'MenuCtrl'

    # GENERAL

    .state 'welcome',
      url: '/welcome'
      private: false
      templateUrl: 'features/authorization/welcome/welcome.html'
      controller: 'WelcomeCtrl'

    .state 'signIn',
      url: '/sign-in'
      private: false
      templateUrl: 'features/authorization/sign-in/sign-in.html'
      controller: 'SignInCtrl'

    .state 'signUp',
      url: '/sign-up'
      private: false
      templateUrl: 'features/authorization/sign-up/sign-up.html'
      controller: 'SignUpCtrl'

    .state 'app.tutorial',
      url: '/tutorial'
      private: true
      views:
        menuContent:
          templateUrl: 'features/tutorials/tutorials.html'
          controller: 'TutorialsCtrl'

    .state 'getPro',
      url: '/get-pro'
      private: false
      templateUrl: 'features/search-for-pro/get-pro/get-pro.html'
      controller: 'GetProCtrl'

    .state 'invitePro',
      url: '/invite-pro'
      private: false
      templateUrl: 'features/search-for-pro/invite-pro/invite-pro.html'
      controller: 'InviteProCtrl'

    .state 'proInvitationSent',
      url: '/pro-invitation-sent'
      private: false
      templateUrl: 'features/search-for-pro/pro-invitation-sent/pro-invitation-sent.html'

    .state 'proRequestSent',
      url: '/pro-request-sent'
      private: false
      templateUrl: 'features/search-for-pro/pro-request-sent/pro-request-sent.html'

    .state 'waitingInvitedPro',
      url: '/waiting-invited-pro'
      private: false
      templateUrl: 'features/search-for-pro/waiting-invited-pro/waiting-invited-pro.html'
      controller: 'WaitingInvitedProCtrl'

    .state 'waitingGymcloudPro',
      url: '/waiting-gymcloud-pro'
      private: false
      templateUrl: 'features/search-for-pro/waiting-gymcloud-pro/waiting-gymcloud-pro.html'

    .state 'forgotPassword',
      url: '/forgot-password'
      private: false
      templateUrl: 'features/authorization/forgot-password/forgot-password.html'
      controller: 'ForgotPasswordCtrl'

    .state 'resetPassword',
      url: '/reset-password'
      private: false
      templateUrl: 'features/authorization/reset-password/reset-password.html'
      controller: 'ResetPasswordCtrl'

    .state 'app.certUpload',
      url: '/onboarding-cert-upload'
      private: true
      views:
        menuContent:
          templateUrl: 'features/certification/cert.html'
          controller: 'CertCtrl'

    .state 'app.certUploaded',
      url: '/onboarding-cert-uploaded'
      private: true
      views:
        menuContent:
          templateUrl: 'features/certification/uploaded/cert-uploaded.html'
          controller: 'CertUploadedCtrl'

    .state 'app.certBlockedAccount',
      url: '/cert-blocked-account'
      private: true
      views:
        menuContent:
          templateUrl: 'features/certification/cert.html'
          controller: 'CertCtrl'

    .state 'app.certBlockedClientsAdd',
      url: '/cert-blocked-clients-add'
      private: true
      views:
        menuContent:
          templateUrl: 'features/certification/cert.html'
          controller: 'CertCtrl'

    .state 'app.onboardingAccount',
      url: '/onboarding-account'
      private: true
      views:
        menuContent:
          templateUrl: 'features/onboarding/account/account.html'
          controller: 'OnboardingAccountCtrl'

    .state 'app.onboardingPrograms',
      url: '/onboarding-programs'
      private: true
      views:
        menuContent:
          templateUrl: 'features/onboarding/programs/programs.html'
          controller: 'OnboardingProgramsCtrl'

    .state 'app.onboardingSuccess',
      url: '/onboarding-success'
      private: true
      views:
        menuContent:
          templateUrl: 'features/onboarding/success/success.html'
          controller: 'OnboardingSuccessCtrl'

    .state 'app.trialEnded',
      url: '/trial-ended'
      private: true
      views:
        menuContent:
          templateUrl: 'features/payments/trial-ended/trial-ended.html'
          controller: 'TrialEndedCtrl'

    .state 'app.comingSoon',
      url: '/coming-soon'
      private: true
      views:
        menuContent:
          templateUrl: 'features/coming-soon/coming-soon.html'

    .state 'app.notifications',
      url: '/notifications'
      private: true
      views:
        menuContent:
          templateUrl: 'features/notifications/notifications.html'
          controller: 'NotificationsCtrl'

    .state 'app.ownCalendar',
      url: '/own-calendar/:userId/:date'
      cache: false
      private: true
      views:
        menuContent:
          templateUrl: 'features/calendar/own-calendar.html'
          controller: 'CalendarCtrl'

    .state 'app.clientCalendar',
      url: '/client-calendar/:userId/:date'
      cache: false
      private: true
      views:
        menuContent:
          templateUrl: 'features/calendar/client-calendar.html'
          controller: 'CalendarCtrl'

    .state 'app.profileEdit',
      url: '/profile-edit'
      private: true
      views:
        menuContent:
          templateUrl: 'features/user/profile-edit/profile-edit.html'
          controller: 'ProfileEditCtrl'


    .state 'app.personalItemsList',
      url: '/users/:userId/:personalType'
      private: true
      views:
        menuContent:
          templateUrl: 'features/personal-items-list/personal-items-list.html'
          controller: 'PersonalItemsListCtrl'

    .state 'app.personalWorkoutNewEvent',
      url: '/users/:userId/personal-workouts/:workoutId/events/new'
      private: true
      views:
        menuContent:
          templateUrl: 'features/events/personal-workout-event/personal-workout-new-event.html'
          controller: 'PersonalWorkoutNewEventCtrl'

    .state 'app.userNewEvent',
      url: '/users/:userId/events/new'
      private: true
      views:
        menuContent:
          templateUrl: 'features/events/user-event/user-new-event.html'
          controller: 'UserNewEventCtrl'

    .state 'app.personalWorkoutEventResults',
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/results'
      private: true
      views:
        menuContent:
          templateUrl: 'features/results/results/results.html'
          controller: 'PersonalWorkoutEventResultsCtrl'

    .state 'app.resultsWorkoutOverview',
      url: '/users/:userId/personal-workouts/:workoutId/overview'
      private: true
      views:
        menuContent:
          templateUrl: 'features/workout/personal/pro-workout.html'
          controller: 'ResultsWorkoutOverviewCtrl'

    .state 'app.resultsSummary',
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/overview'
      private: true
      views:
        menuContent:
          templateUrl: 'features/results/overview/results-overview.html'
          controller: 'ResultsOverviewCtrl'

    .state 'app.eventCompleted',
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/completed'
      private: true
      views:
        menuContent:
          templateUrl: 'features/events/completed/event-completed.html'
          controller: 'EventCompletedCtrl'

    .state 'app.test',
      url: '/test'
      private: true
      views:
        menuContent:
          templateUrl: 'features/to-implement/test.html'
          controller: 'TestCtrl'

    .state 'app.workoutsThisWeek',
      url: '/workouts-this-week'
      private: true
      views:
        menuContent:
          templateUrl: 'features/workouts-this-week/workouts-this-week.html'
          controller: 'WorkoutsThisWeekCtrl'

    .state 'app.clientsPerfomance',
      url: '/clients-perfomance'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients-perfomance/clients-perfomance.html'
          controller: 'ClientsPerfomanceCtrl'

    .state 'app.videoLibrary',
      url: '/video-library'
      cache: false
      private: true
      views:
        menuContent:
          templateUrl: 'features/videos/library/video-library.html'
          controller: 'VideoLibraryCtrl'

    .state 'app.clientVideoLibrary',
      url: '/users/:userId/video-library'
      private: true
      views:
        menuContent:
          templateUrl: 'features/videos/client-library/client-video-library.html'
          controller: 'ClientVideoLibraryCtrl'

    .state 'app.videoEdit',
      url: '/video-library/:videoId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/videos/edit/video-edit.html'
          controller: 'VideoEditCtrl'

    .state 'app.conversationsList',
      url: '/conversations-list'
      private: true
      cache: false
      views:
        menuContent:
          templateUrl: 'features/conversations/list/conversations-list.html'
          controller: 'ConversationsListCtrl'

    .state 'app.newConversationRecipients',
      url: '/new-conversation-recipients'
      private: true
      views:
        menuContent:
          templateUrl: 'features/conversations/recipients/new-conversation-recipients.html'
          controller: 'NewConversationRecipientsCtrl'

    .state 'app.newConversation',
      url: '/new-conversation/:recipientId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/conversations/new/new-conversation.html'
          controller: 'ConversationCtrl'

    # PRO

    .state 'app.proDashboard',
      url: '/pro-dashboard'
      private: true
      views:
        menuContent:
          templateUrl: 'features/dashboard/dashboard.html'
          controller: 'DashboardCtrl'

    .state 'app.myTraining',
      url: '/my-training'
      private: true
      views:
        menuContent:
          templateUrl: 'features/user/profile/my-training.html'
          controller: 'UserProfileCtrl'


    .state 'app.clients',
      url: '/clients'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/list/clients.html'
          controller: 'ClientsCtrl'

    .state 'app.inviteClient',
      url: '/clients/invite'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/invite/invite-client.html'
          controller: 'InviteClientCtrl'

    .state 'app.createGroup',
      url: '/clients/create-group'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/create-group/create-group.html'
          controller: 'CreateGroupCtrl'

    .state 'app.addParticipants',
      url: '/clients/group/:groupId/add-participants'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/add-participants-to-group/add-participants.html'
          controller: 'AddParticipantsCtrl'

    .state 'app.clientGroup',
      url: '/client-group/:groupId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/client-group/client-group.html'
          controller: 'ClientGroupCtrl'

    .state 'app.groupTemplatesList',
      url: '/client-group/:groupId/:templateType'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/group-templates-list/group-templates-list.html'
          controller: 'GroupTemplatesListCtrl'

    .state 'app.groupClients',
      url: '/client-group/:groupId/clients'
      private: true
      views:
        menuContent:
          templateUrl: 'features/clients/group-clients/group-clients.html'
          controller: 'GroupClientsCtrl'

    .state 'app.userProfile',
      url: '/users/:userId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/user/profile/user-profile.html'
          controller: 'UserProfileCtrl'

    .state 'app.assignItem',
      url: '/assign/:itemType/:itemId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/assign/assign.html'
          controller: 'AssignCtrl'


    .state 'app.exerciseTemplate',
      url: '/exercise-templates/:exerciseId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/exercise/template/exercise-template.html'
          controller: 'ExerciseTemplateCtrl'

    .state 'app.workoutTemplate',
      url: '/workout-templates/:workoutId'
      private: true
      edge: true
      views:
        menuContent:
          templateUrl: 'features/workout/template/workout-template.html'
          controller: 'WorkoutTemplateCtrl'

    .state 'app.workoutTemplateWarmups',
      url: '/workout-template-warmups/:workoutId'
      private: true
      edge: true
      views:
        menuContent:
          templateUrl: 'features/workout/template/workout-template-warmups.html'
          controller: 'WorkoutTemplateCtrl'

    .state 'app.workoutTemplateExercise',
      url: '/workout-templates/:workoutId/exercise/:exerciseId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html'
          controller: 'ExerciseTemplateCtrl'

    .state 'app.programTemplate',
      url: '/program-templates/:programId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/program/template/program-template.html'
          controller: 'ProgramCtrl'

    .state 'app.programTemplateOverview',
      url: '/program-templates/:programId/overview/:workoutId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/program/template-overview/program-template-overview.html'
          controller: 'ProgramTemplateOverviewCtrl'


    .state 'app.workoutExercise',
      url: '/users/:userId/workout-exercises/:exerciseId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html'
          controller: 'WorkoutExerciseCtrl'

    .state 'app.personalExercise',
      url: '/users/:userId/personal-exercises/:exerciseId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html'
          controller: 'PersonalExerciseCtrl'

    .state 'app.personalWorkout',
      url: '/users/:userId/personal-workouts/:workoutId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/workout/personal/pro-workout.html'
          controller: 'PersonalWorkoutCtrl'

    .state 'app.personalProgram',
      url: '/users/:userId/personal-programs/:programId/'
      private: true
      views:
        menuContent:
          templateUrl: 'features/program/personal/pro-program.html'
          controller: 'ProgramCtrl'

    .state 'app.personalProgramWorkout',
      url: '/users/:userId/personal-programs/:programId/workouts/:workoutId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/workout/personal/pro-workout.html'
          controller: 'PersonalWorkoutCtrl'

    .state 'app.templatesList',
      url: '/:templateType/:folderId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/templates-list/templates-list.html'
          controller: 'TemplatesListCtrl'

    .state 'app.exerciseFolderTemplate',
      url: '/:templateType/:folderId/exercise-templates/:exerciseId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/exercise/folder-template/exercise-template.html'
          controller: 'ExerciseTemplateCtrl'

    .state 'app.workoutFolderTemplate',
      url: '/:templateType/:folderId/workout-templates/:workoutId'
      private: true
      edge: true
      views:
        menuContent:
          templateUrl: 'features/workout/folder-template/workout-template.html'
          controller: 'WorkoutTemplateCtrl'

    .state 'app.programFolderTemplate',
      url: '/:templateType/:folderId/program-templates/:programId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/program/folder-template/program-template.html'
          controller: 'ProgramCtrl'

    .state 'app.newTemplate',
      url: '/new/:templateType'
      private: true
      views:
        menuContent:
          templateUrl: 'features/new-template/new-template.html'
          controller: 'NewTemplateCtrl'

    .state 'app.proConversation',
      url: '/conversation/:conversationId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/conversations/conversation/pro-conversation.html'
          controller: 'ConversationCtrl'

    # CLIENT

    .state 'app.clientDashboard',
      url: '/client-dashboard'
      private: true
      views:
        menuContent:
          templateUrl: 'features/dashboard/dashboard.html'
          controller: 'DashboardCtrl'

    .state 'app.clientPersonalWorkout',
      url: '/users/:userId/personal-workouts/:workoutId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/workout/personal/client-workout.html'
          controller: 'PersonalWorkoutCtrl'

    .state 'app.clientPersonalProgram',
      url: '/users/:userId/personal-programs/:programId/'
      private: true
      views:
        menuContent:
          templateUrl: 'features/program/personal/client-program.html'
          controller: 'ProgramCtrl'

    .state 'app.clientConversation',
      url: '/conversation/:conversationId'
      private: true
      views:
        menuContent:
          templateUrl: 'features/conversations/conversation/client-conversation.html'
          controller: 'ConversationCtrl'

    $urlRouterProvider.otherwise '/welcome'
]
