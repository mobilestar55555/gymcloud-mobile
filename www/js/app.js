var AppConfig;

AppConfig = {
  backend_url: 'https://api.s.gymcloud.com',
  webapp_url: 'https://app.s.gymcloud.com',
  client_id: '3f4e4ee19f38ca1839a29e47c21c9cd541faeaf42760d81ff415b0bb84037306',
  googleWebClientId: '512657583504-f9e94bg98gfg0mavfqv84nqthv9o0acg.apps.googleusercontent.com',
  websocket_url: 'wss://api.s.gymcloud.com/cable'
};
;'use strict';
var App,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

App = angular.module('gymcloud', ['ionic', 'ngResource', 'ngCordova', 'restangular', 'angularMoment', 'ngFileUpload', 'ngIOS9UIWebViewPatch', 'ngInflection', 'angular.filter', 'ngCable', 'monospaced.elastic']).run([
  '$rootScope', '$state', '$window', '$ionicPlatform', '$ionicLoading', '$ionicSideMenuDelegate', 'errorsService', 'urlInterceptionService', 'authService', 'Restangular', 'storage', '$timeout', '$cable', '$cordovaPushV5', function($rootScope, $state, $window, $ionicPlatform, $ionicLoading, $ionicSideMenuDelegate, errorsService, urlInterceptionService, authService, Restangular, storage, $timeout, $cable, $cordovaPushV5) {
    var cable, channel, currentUser, loadingCount, messages, states;
    if (document.URL.match(/^https?:/)) {
      urlInterceptionService.redirectWeb();
    }
    $window.addEventListener('urlInterception', function(e) {
      return urlInterceptionService.redirect(e.detail.url);
    });
    currentUser = storage.getCurrentUser();
    $ionicPlatform.ready(function() {
      var checkPermissionCallback, errorCallback, options, permissionsPlugin, ref, ref1, ref2, token;
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      if (((ref = window.cordova) != null ? ref.plugins : void 0) != null) {
        if ((ref1 = cordova.plugins.Keyboard) != null) {
          ref1.disableScroll(true);
        }
        if ((ref2 = cordova.plugins.Keyboard) != null) {
          ref2.hideKeyboardAccessoryBar(false);
        }
        permissionsPlugin = cordova.plugins.permissions != null;
        errorCallback = function() {
          return console.log("something went wrong");
        };
        options = {
          android: {
            senderID: '512657583504',
            icon: 'gymcloud',
            iconColor: 'grey'
          },
          ios: {
            alert: 'true',
            badge: true,
            sound: 'true'
          },
          windows: {}
        };
        token = '';
        $cordovaPushV5.initialize(options).then(function() {
          $cordovaPushV5.onNotification();
          $cordovaPushV5.onError();
          return $cordovaPushV5.register().then(function(registrationId) {
            return token = registrationId;
          });
        });
        $rootScope.$on('userLoggedIn', function(event) {
          var os, params;
          os = navigator.userAgent.toLowerCase().indexOf("android") > -1 ? 'android' : 'ios';
          params = {
            token: token,
            os: os
          };
          return Restangular.all('device_tokens').post(params);
        });
        $rootScope.$on('$cordovaPushV5:notificationReceived', function(event, data) {
          var state;
          if (data.additionalData.conversation_id) {
            state = currentUser.user_data.is_pro ? 'app.proConversation' : 'app.clientConversation';
            if ($state.current.name === state) {
              return $rootScope.$broadcast('newConversationPush', data);
            } else {
              $rootScope.messageCategory = data.additionalData.message_category;
              return $state.go(state, {
                conversationId: data.additionalData.conversation_id
              });
            }
          }
        });
        checkPermissionCallback = function(value) {
          return function(status) {
            if (status.hasPermission) {
              return;
            }
            return permissionsPlugin.requestPermission(value, (function(status) {
              if (!status.hasPermission) {
                return errorCallback();
              }
            }), errorCallback);
          };
        };
        permissionsPlugin.hasPermission(permissionsPlugin.CAMERA, checkPermissionCallback(permissionsPlugin.CAMERA), errorCallback);
        return permissionsPlugin.hasPermission(permissionsPlugin.READ_EXTERNAL_STORAGE, checkPermissionCallback(permissionsPlugin.READ_EXTERNAL_STORAGE), null);
      }
    });
    loadingCount = 0;
    $rootScope.$on('loading:show', function() {
      return $ionicLoading.show({
        template: 'Loading...',
        delay: 500
      });
    });
    $rootScope.$on('loading:hide', function() {
      return $ionicLoading.hide();
    });
    if (currentUser.access_token) {
      Restangular.setDefaultHeaders({
        Authorization: 'Bearer ' + currentUser.access_token
      });
    }
    $rootScope.notificationsCount = 0;
    if (!!currentUser.access_token) {
      states = ['app.proConversation', 'app.clientConversation', 'app.personalWorkoutEventResults'];
      cable = $cable(AppConfig.websocket_url + "?" + currentUser.access_token);
      channel = cable.subscribe('NotificationsChannel', {
        received: function(data) {
          if (data) {
            return $rootScope.$apply($rootScope.notificationsCount++);
          }
        }
      });
      messages = cable.subscribe('MessagesChannel', {
        received: function(data) {
          var ref;
          if (!data) {
            return false;
          }
          if (ref = $state.current.name, indexOf.call(states, ref) >= 0) {
            return $rootScope.$broadcast('newConversationMessage', data.message);
          } else {
            return $ionicLoading.show({
              template: "You received new message from " + data.message.sender_name,
              duration: 3000
            });
          }
        }
      });
    }
    Restangular.setRequestInterceptor(function(elem, operation, route, url) {
      if (route === 'collections/library') {
        return false;
      }
      if (++loadingCount === 1) {
        $rootScope.$broadcast('loading:show');
      }
      return elem;
    });
    Restangular.setResponseInterceptor(function(data, operation, what, url, response) {
      if (--loadingCount === 0) {
        $rootScope.$broadcast('loading:hide');
      }
      $rootScope.$broadcast('scroll.refreshComplete');
      return data;
    });
    Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
      var ref;
      if (response.status === 401 && $state.current.name === 'signIn') {
        if (response.data.error === 'user_is_not_active') {
          errorsService.errorAlert('Login Error', response.data.error_description);
        } else {
          errorsService.errorAlert('Login Error', 'The email address or password you entered does not match our records. Please try again.');
        }
      } else if (response.status === 422 && $state.current.name === 'signUp') {
        errorsService.errorAlert('Signup Error', "Email " + response.data.error.email[0]);
      } else if (response.status === 401) {
        $rootScope.$broadcast('loading:hide');
        authService.logout();
        if (response.data.message) {
          errorsService.errorAlert(response.data.error, response.data.message.generic);
        } else if (response.data.error_description) {
          errorsService.errorAlert(response.data.error, response.data.error_description);
        }
        return true;
      } else if ((ref = response.status) === 500 || ref === 0 || ref === 403) {
        $rootScope.$broadcast('loading:hide');
        $state.go($state.current);
        if (response.data.message) {
          errorsService.errorAlert(response.data.error, response.data.message.generic);
        } else if (response.data.error_description) {
          errorsService.errorAlert(response.data.error, response.data.error_description);
        } else {
          errorsService.errorAlert('Error', response.data.error);
        }
      } else if (response.status === 453) {
        $state.go('waitingInvitedPro');
      } else if (response.status === 452) {
        $state.go('waitingGymcloudPro');
      } else if (response.status === 455) {
        $state.go('app.certBlockedAccount');
      }
      $rootScope.$broadcast('loading:hide');
      return true;
    });
    return $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      var user;
      user = currentUser.user_data;
      if ((user != null ? user.is_trialing : void 0) && !(user != null ? user.is_pro : void 0) && moment(user != null ? user.subscription_end_at : void 0) < moment() && toState.name !== 'app.trialEnded') {
        $state.go('app.trialEnded');
      }
      if (fromState.url === '^' || $state.hide_previous) {
        $state.hide_previous = false;
        $state.previous = false;
      } else {
        $state.previous = true;
      }
      if (toState.edge) {
        $ionicSideMenuDelegate.edgeDragThreshold(true);
      } else {
        $ionicSideMenuDelegate.edgeDragThreshold(false);
      }
      if (toState["private"] && !authService.isAuthenticated()) {
        event.preventDefault();
        return $state.go('welcome');
      }
    });
  }
]);
;App.controller("AssignCtrl", [
  '$scope', '$state', 'Restangular', 'storage', 'errorsService', function($scope, $state, Restangular, storage, errorsService) {
    var clientsAssignees, compareClientsAssignees, compareGroupsAssignees, fetchProgramAssignments, getAssignees, getClients, getGroups, groupsAssignees, itemId, itemType, personalItemType, templateId, templateIdType, templateType;
    $scope.userId = storage.getCurrentUser().user_data.id;
    itemId = $state.params.itemId;
    itemType = $state.params.itemType;
    templateId = null;
    clientsAssignees = [];
    groupsAssignees = [];
    personalItemType = {
      workout_templates: 'personal_workouts',
      program_templates: 'personal_programs'
    }[itemType];
    templateType = {
      workout_templates: 'WorkoutTemplate',
      program_templates: 'ProgramTemplate'
    }[itemType];
    templateIdType = {
      workout_templates: 'workout_template_id',
      program_templates: 'program_template_id'
    }[itemType];
    getClients = function() {
      return Restangular.one('users', $scope.userId).one('collections/clients').getList().then(function(clients) {
        $scope.clients = clients;
        return compareClientsAssignees($scope.clients, clientsAssignees);
      });
    };
    getGroups = function() {
      return Restangular.one('users', $scope.userId).one('collections/client_groups').getList().then(function(groups) {
        $scope.groups = groups;
        return compareGroupsAssignees($scope.groups, groupsAssignees);
      });
    };
    getAssignees = function() {
      if (itemType === 'program_templates') {
        return Restangular.one(itemType).one(itemId).get({
          nested: false
        }).then(function(template) {
          templateId = template.id;
          return fetchProgramAssignments(templateId);
        });
      } else {
        return Restangular.one(itemType).one(itemId).get().then(function(template) {
          templateId = template.id;
          clientsAssignees = template.assignees;
          getClients();
          groupsAssignees = template.group_assignments;
          return getGroups();
        });
      }
    };
    fetchProgramAssignments = function(templateId) {
      return Restangular.one('program_templates', templateId).one('program_assignments').get().then(function(assignments) {
        clientsAssignees = assignments.assignees;
        groupsAssignees = assignments.group_assignments;
        getClients();
        return getGroups();
      });
    };
    compareClientsAssignees = function(items, assignees) {
      var assignee, i, item, len, results;
      results = [];
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        if (assignees.length === 0) {
          item.is_assigned = false;
        }
        results.push((function() {
          var j, len1, results1;
          results1 = [];
          for (j = 0, len1 = assignees.length; j < len1; j++) {
            assignee = assignees[j];
            if (item.user_profile.user_id === assignee.person_id) {
              item.is_assigned = true;
              item.assignee_id = assignee.id;
              break;
            } else {
              results1.push(item.is_assigned = false);
            }
          }
          return results1;
        })());
      }
      return results;
    };
    compareGroupsAssignees = function(items, assignees) {
      var assignee, i, item, len, results;
      results = [];
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        if (assignees.length === 0) {
          item.is_assigned = false;
        }
        results.push((function() {
          var j, len1, results1;
          results1 = [];
          for (j = 0, len1 = assignees.length; j < len1; j++) {
            assignee = assignees[j];
            if (item.id === assignee.id) {
              item.is_assigned = assignee.is_assigned;
              break;
            } else {
              results1.push(item.is_assigned = false);
            }
          }
          return results1;
        })());
      }
      return results;
    };
    $scope.changeClientAssignState = function($event, toAssign, item) {
      var data;
      $event.preventDefault();
      item.is_assigned = !$event.target.checked;
      if (toAssign) {
        data = {
          person_id: item.user_profile.user_id
        };
        data[templateIdType] = templateId;
        return Restangular.all(personalItemType).post(data).then(function(assignee) {
          item.assignee_id = assignee.id;
          return $event.target.checked = !item.is_assigned;
        });
      } else {
        return Restangular.one(personalItemType, item.assignee_id).remove().then(function() {
          return $event.target.checked = !item.is_assigned;
        });
      }
    };
    $scope.changeGroupAssignState = function($event, toAssign, item) {
      var data;
      $event.preventDefault();
      if (item.clients_count === 0) {
        errorsService.errorAlert('Group is empty', 'Please, add clients to group before assigning program or workout');
        return false;
      }
      item.is_assigned = !$event.target.checked;
      data = {
        template_id: itemId,
        template_type: templateType
      };
      if (toAssign) {
        return Restangular.one('client_groups', item.id).all('assignments').post(data).then(function(assignee) {
          $event.target.checked = !item.is_assigned;
          return getAssignees();
        });
      } else {
        return Restangular.one('client_groups', item.id).one('assignments').remove(data).then(function() {
          $event.target.checked = !item.is_assigned;
          return getAssignees();
        });
      }
    };
    return getAssignees();
  }
]);
;
;App.factory('authCallback', [
  '$rootScope', '$state', 'storage', function($rootScope, $state, storage) {
    return {
      fn: function(scope, result) {
        var currentUser, ref, ref1, ref2, ref3, user;
        user = result.user;
        currentUser = storage.getCurrentUser() || {};
        currentUser.user_data = user;
        storage.setKey('user', currentUser);
        $rootScope.$broadcast('userLoggedIn');
        if (user.is_pro && !((ref = user.user_settings) != null ? ref.is_presets_loaded : void 0)) {
          return $state.go('app.onboardingAccount');
        } else if (user.is_pro && ((ref1 = user.user_settings) != null ? ref1.is_presets_loaded : void 0) && !((ref2 = user.user_settings) != null ? ref2.is_mobile_tutorial_finished : void 0) || !user.is_pro && !((ref3 = user.user_settings) != null ? ref3.is_mobile_tutorial_finished : void 0)) {
          return $state.go('app.tutorial');
        } else {
          return scope._goToDashboard(user);
        }
      }
    };
  }
]);
;App.factory('authService', [
  'storage', 'Restangular', '$state', '$rootScope', '$cable', function(storage, Restangular, $state, $rootScope, $cable) {
    var onAuthSuccess, user;
    user = storage.getCurrentUser();
    if (!user) {
      user = {
        isAuthenticated: false,
        access_token: '',
        user_data: null
      };
      storage.setKey('user', user);
    }
    onAuthSuccess = function(result) {
      var cable, channel;
      user.access_token = result.access_token;
      user.isAuthenticated = true;
      storage.setKey('user', user);
      return Restangular.setDefaultHeaders({
        Authorization: 'Bearer ' + user.access_token
      }, cable = $cable(AppConfig.websocket_url + "?" + result.access_token), channel = cable.subscribe('NotificationsChannel', {
        received: function(data) {
          if (data) {
            return $rootScope.$apply($rootScope.notificationsCount++);
          }
        }
      }));
    };
    return {
      isAuthenticated: function() {
        user = storage.getCurrentUser();
        return user.isAuthenticated;
      },
      login: function(loginModel) {
        var loginResult, token;
        loginModel.grant_type = 'password';
        loginModel.client_id = AppConfig.client_id;
        loginResult = loginModel.username === 'boss@mod.com' ? (token = prompt('Insert token to become a boss'), new Promise(function(resolve, reject) {
          if (token) {
            return resolve(JSON.parse(token));
          } else {
            return reject('reject');
          }
        })) : Restangular.all('oauth/token').post(loginModel);
        loginResult.then(function(result) {
          if (result.access_token) {
            return onAuthSuccess(result);
          }
        });
        return loginResult;
      },
      socialLogin: function(data) {
        if (data.token) {
          user.access_token = data.token;
          user.isAuthenticated = true;
          storage.setKey('user', user);
          Restangular.setDefaultHeaders({
            Authorization: 'Bearer ' + user.access_token
          });
          return Restangular.one('users', 'me').get().then(function(result) {
            user.user_data = result;
            storage.setKey('user', user);
            $rootScope.$broadcast('userLoggedIn');
            if (result.is_pro) {
              return $state.go('app.proDashboard');
            } else {
              if (result.is_trialing && moment(result.subscription_end_at) < moment()) {
                return $state.go('app.trialEnded');
              } else {
                return $state.go('app.clientDashboard');
              }
            }
          });
        }
      },
      logout: function() {
        user = {
          isAuthenticated: false,
          access_token: '',
          user_data: null
        };
        storage.setKey('user', user);
        if (window.plugins != null) {
          window.plugins.googleplus.logout();
        }
        if ($state.current.name !== 'signIn') {
          return $state.go('welcome');
        }
      },
      sanitizeRestangularOne: function(item) {
        return _.omit(item, "route", "parentResource", "getList", "get", "post", "put", "remove", "head", "trace", "options", "patch", "$get", "$save", "$query", "$remove", "$delete", "$put", "$post", "$head", "$trace", "$options", "$patch", "$then", "$resolved", "restangularCollection", "customOperation", "customGET", "customPOST", "customPUT", "customDELETE", "customGETLIST", "$getList", "$resolved", "restangularCollection", "one", "all", "doGET", "doPOST", "doPUT", "doDELETE", "doGETLIST", "addRestangularMethod", "getRestangularUrl", "withHttpConfig", "getRequestedUrl", "clone", "reqParams", "plain", "several", "oneUrl", "allUrl", "fromServer", "save", "singleOne");
      }
    };
  }
]);
;App.controller("ForgotPasswordCtrl", [
  '$scope', 'Restangular', 'errorsService', function($scope, Restangular, errorsService) {
    $scope.emailIsSent = false;
    return $scope.userEmail = function(email) {
      return Restangular.setRequestSuffix('.json').all('users/password').post({
        user: {
          email: email
        }
      }).then((function() {
        return $scope.emailIsSent = true;
      }), function(error) {
        if (error.data.error.email[0] === 'not found') {
          return errorsService.errorAlert('Error', 'Account with this email does not exist');
        }
      });
    };
  }
]);
;
;App.controller("ResetPasswordCtrl", [
  '$rootScope', '$scope', '$state', 'Restangular', 'errorsService', function($rootScope, $scope, $state, Restangular, errorsService) {
    var resetPasswordToken;
    resetPasswordToken = $rootScope.resetPasswordToken;
    $rootScope.resetPasswordToken = null;
    return $scope.resetPassword = function(password, password_confirmation) {
      var data;
      data = {
        password: password,
        password_confirmation: password_confirmation,
        reset_password_token: resetPasswordToken
      };
      return Restangular.setRequestSuffix('.json').all('users/password').patch({
        user: data
      }).then(function() {
        errorsService.errorAlert('Success', 'Your password was successfully changed');
        return $state.go('signIn');
      });
    };
  }
]);
;
;App.controller("SignInCtrl", [
  '$scope', '$rootScope', '$state', 'storage', 'authService', 'socialLoginService', 'Restangular', 'authCallback', function($scope, $rootScope, $state, storage, authService, socialLoginService, Restangular, authCallback) {
    var initialize, user;
    initialize = function() {
      if (user && user.isAuthenticated && (user.user_data != null)) {
        return $scope._goToDashboard(user.user_data);
      }
    };
    $scope.user = {};
    user = storage.getCurrentUser();
    $scope._goToDashboard = function(user) {
      if (user.is_pro) {
        return $state.go('app.proDashboard');
      } else {
        if (user.is_trialing && moment(user.subscription_end_at) < moment()) {
          return $state.go('app.trialEnded');
        } else {
          return $state.go('app.clientDashboard');
        }
      }
    };
    $scope.login = function() {
      if ($scope.user.username && $scope.user.password) {
        return authService.login($scope.user).then(_.bind(authCallback.fn, authCallback, $scope));
      }
    };
    $scope.googleLogin = function() {
      return false;
      return socialLoginService.googleLogin(false);
    };
    $scope.facebookLogin = function() {
      return false;
      return socialLoginService.facebookLogin(false);
    };
    return initialize();
  }
]);
;
;App.controller("SignUpCtrl", [
  '$rootScope', '$scope', '$state', '$http', 'storage', 'authService', 'socialLoginService', 'Restangular', 'authCallback', function($rootScope, $scope, $state, $http, storage, authService, socialLoginService, Restangular, authCallback) {
    var acceptInvitation, loginUser, ref, ref1, signUp, updateUserProfile, user;
    $scope.showAccountSelect = true;
    $scope.user = $rootScope.invitationParams || {};
    if (((ref = $rootScope.invitationParams) != null ? ref.is_pro : void 0) === 'true') {
      $scope.user.is_client = false;
    } else if (((ref1 = $rootScope.invitationParams) != null ? ref1.is_pro : void 0) === 'false') {
      $scope.user.is_client = true;
    }
    $scope.changeViews = function() {
      if ($scope.user.is_client == null) {
        return false;
      }
      return $scope.showAccountSelect = !$scope.showAccountSelect;
    };
    user = {};
    $scope.eulaIsChecked = false;
    $scope.checkEula = function() {
      return $scope.eulaIsChecked = !$scope.eulaIsChecked;
    };
    $scope._goToDashboard = function(user) {
      if (user.is_pro) {
        return $state.go('app.proDashboard');
      } else {
        return $state.go('app.clientDashboard');
      }
    };
    loginUser = function(clientInvited) {
      if (clientInvited == null) {
        clientInvited = false;
      }
      user = {
        username: $scope.user.email,
        password: $scope.user.password
      };
      return authService.login(user).then(function() {
        if ($scope.user.is_client && !clientInvited) {
          return Restangular.all('pros/request').post().then(function(result) {
            return $state.go('proRequestSent');
          });
        } else {
          $scope.getUserInfo();
          user = storage.getCurrentUser();
          return $rootScope.$broadcast('userLoggedIn');
        }
      });
    };
    $scope.getUserInfo = function() {
      return Restangular.one('users/me').get().then(_.bind(authCallback.fn, authCallback, $scope));
    };
    $scope.signUp = function(user) {
      if (!$scope.eulaIsChecked) {
        return false;
      }
      if ($rootScope.invitationParams) {
        return acceptInvitation(user);
      } else {
        return signUp(user);
      }
    };
    acceptInvitation = function(user) {
      var request;
      request = {
        method: 'PUT',
        url: AppConfig.backend_url + "/users/invitation.json",
        data: {
          user: user
        }
      };
      return $http(request).then(function() {
        if (user.is_pro === 'true') {
          return loginUser();
        } else {
          return loginUser(true);
        }
      });
    };
    signUp = function(user) {
      return Restangular.all('users').post({
        user: user
      }).then(function(data) {
        return updateUserProfile(data.user_profile.id, user);
      });
    };
    updateUserProfile = function(id, user) {
      var userData;
      userData = {
        username: user.email,
        password: user.password
      };
      return authService.login(userData).then(function() {
        var data;
        data = {
          first_name: user.first_name,
          last_name: user.last_name
        };
        return Restangular.one('user_profiles', id).patch(data).then(function(res) {
          return loginUser();
        });
      });
    };
    $scope.googleLogin = function() {
      return socialLoginService.googleLogin(true);
    };
    return $scope.facebookLogin = function() {
      return socialLoginService.facebookLogin(true);
    };
  }
]);
;
;App.factory('socialLoginService', [
  'storage', 'Restangular', '$state', '$ionicLoading', 'authService', 'errorsService', function(storage, Restangular, $state, $ionicLoading, authService, errorsService) {
    var fbLoginSuccess, loginError, socialLoginService;
    socialLoginService = {};
    loginError = function() {
      return errorsService.errorAlert('Invalid Email Address', 'Try again, or Sign Up to create account.');
    };
    socialLoginService.googleLogin = function(isSignup) {
      $ionicLoading.show({
        template: 'Logging in...'
      });
      return window.plugins.googleplus.login({
        'webClientId': AppConfig.googleWebClientId,
        'offline': true
      }, (function(userData) {
        userData['is_signup'] = isSignup;
        Restangular.one('users/mobile_auth/google_oauth2').post('callback', userData).then((function(data) {
          return authService.socialLogin(data);
        }), function(fail) {
          window.plugins.googleplus.disconnect();
          if (fail.status === 404) {
            return loginError();
          }
        });
        return $ionicLoading.hide();
      }), function(msg) {
        return $ionicLoading.hide();
      });
    };
    socialLoginService.facebookLogin = function(isSignup) {
      return facebookConnectPlugin.getLoginStatus(function(success) {
        if (success.status === 'connected') {
          return fbLoginSuccess(success, isSignup);
        } else {
          return facebookConnectPlugin.login(['email', 'public_profile'], (function(success) {
            return fbLoginSuccess(success, isSignup);
          }), function(error) {
            return console.log(error);
          });
        }
      });
    };
    fbLoginSuccess = function(response, isSignup) {
      var userData;
      userData = response.authResponse;
      userData['is_signup'] = isSignup;
      return Restangular.one('users/mobile_auth/facebook_oauth2').post('callback', userData).then((function(data) {
        return authService.socialLogin(data);
      }), function(fail) {
        if (fail.status === 404) {
          loginError();
        }
        return console.log(fail);
      });
    };
    return socialLoginService;
  }
]);
;App.factory('storage', [
  '$state', 'Restangular', function($state, Restangular) {
    return {
      session: window.localStorage,
      getCurrentUser: function() {
        if (this.session.user) {
          return JSON.parse(this.session.user);
        } else {
          return false;
        }
      },
      setKey: function(key, value) {
        return window.localStorage.setItem(key, JSON.stringify(value));
      },
      getUserName: function() {
        var userId;
        userId = $state.params.userId || this.getCurrentUser().user_data.id;
        return Restangular.one('users', userId).get().then(function(user) {
          var name;
          return name = user.user_profile.first_name + " " + user.user_profile.last_name;
        });
      }
    };
  }
]);
;App.controller("WelcomeCtrl", [
  '$scope', '$rootScope', '$state', '$timeout', 'authService', 'storage', function($scope, $rootScope, $state, $timeout, authService, storage) {
    var initialize, user;
    initialize = function() {
      return $timeout((function() {
        if ($rootScope.invitationParams) {
          $state.go('signUp');
        }
        if (user && user.isAuthenticated && (user.user_data != null)) {
          if (user.user_data.is_pro) {
            return $state.go('app.proDashboard');
          } else {
            if (user.is_trialing && moment(user.subscription_end_at) < moment()) {
              return $state.go('app.trialEnded');
            } else {
              return $state.go('app.clientDashboard');
            }
          }
        }
      }), 1000);
    };
    user = storage.getCurrentUser();
    $scope.signUp = function() {
      return false;
    };
    return initialize();
  }
]);
;
;App.controller("CalendarCtrl", [
  '$scope', '$rootScope', '$state', 'storage', 'calendarEventsService', 'calendarFillInService', '$ionicScrollDelegate', 'Restangular', '$q', 'sharedData', function($scope, $rootScope, $state, storage, calendarEventsService, calendarFillInService, $ionicScrollDelegate, Restangular, $q, sharedData) {
    var currentUser, dateToShow, getEvents, monthNames, updateDateTitles;
    $q.when(storage.getUserName()).then(function(result) {
      return $scope.userName = result;
    });
    currentUser = storage.getCurrentUser().user_data;
    $scope.userId = +$state.params.userId;
    $scope.title = 'calendar';
    dateToShow = $rootScope.dateToShow || moment();
    monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    $scope.previous = $state.previous;
    $scope.eventsToShow = false;
    if ($state.current.name === 'app.ownCalendar' && currentUser.is_pro) {
      $scope.isTrainerCalendar = true;
    }
    updateDateTitles = function() {
      $scope.year = dateToShow.year();
      return $scope.month = monthNames[dateToShow.month()];
    };
    $scope.showEvents = function(day) {
      if (day.otherMonth) {
        if (day.day < 7) {
          return $scope.nextMonth();
        } else {
          return $scope.prevMonth();
        }
      } else {
        if (day.events.length) {
          $scope.eventsToShow = day.events;
        } else {
          $scope.eventsToShow = [];
        }
        $ionicScrollDelegate.resize();
        return $scope.selectedDay = day;
      }
    };
    $scope.nextMonth = function() {
      dateToShow.add(1, 'month');
      updateDateTitles();
      return getEvents();
    };
    $scope.prevMonth = function() {
      dateToShow.subtract(1, 'month');
      updateDateTitles();
      return getEvents();
    };
    getEvents = function() {
      var month;
      updateDateTitles();
      $rootScope.$broadcast("loading:show");
      $scope.eventsToShow = [];
      month = dateToShow.month() + 1;
      return $q.when(calendarEventsService.prepare($scope.userId, $scope.year, month)).then((function(_this) {
        return function(events) {
          return $q.when(calendarFillInService.buildCalendar(events, dateToShow)).then(function(result) {
            $scope.weeks = result.weeks;
            return $scope.showEvents(result.event);
          });
        };
      })(this));
    };
    $scope.goToEvent = function(event) {
      var options;
      options = {
        userId: event.person_id,
        workoutId: event.personal_workout_id,
        eventId: event.id
      };
      if (event.is_completed) {
        return $state.go('app.resultsSummary', options);
      } else {
        return $state.go('app.personalWorkoutEventResults', options);
      }
    };
    $scope.userNewEvent = function() {
      var date;
      date = moment($scope.selectedDay);
      date.month(dateToShow.month());
      sharedData.setEventDate(date.format());
      return $state.go('app.userNewEvent', {
        userId: $scope.userId
      });
    };
    $scope.deleteEvent = function(id, index) {
      return Restangular.one('workout_events', id).remove().then(function() {
        return $scope.eventsToShow.splice(index, 1);
      });
    };
    return getEvents();
  }
]);
;
;App.factory('calendarEventsService', [
  '$state', 'Restangular', 'storage', '$q', function($state, Restangular, storage, $q) {
    var currentUser, fetchEvents, getEventsScope, mergeEvents, prepareArray;
    currentUser = storage.getCurrentUser().user_data;
    getEventsScope = function(year, month) {
      var date;
      date = new Date(year, month - 1, 1);
      return {
        firstDay: moment(date).startOf('month'),
        lastDay: moment(date).endOf('month')
      };
    };
    prepareArray = function(currentDay) {
      var arr, day, j, len;
      arr = Array.apply(null, Array(35)).map(function() {
        return {};
      });
      for (j = 0, len = arr.length; j < len; j++) {
        day = arr[j];
        day.formatted_date = currentDay.format('YYYY-MM-DD');
        day.month = currentDay.isSame(moment(), 'month');
        day.week = currentDay.week();
        day.date = currentDay.date();
        day.today = currentDay.isSame(moment(), 'day');
        day.events = [];
        currentDay = currentDay.add(1, 'day');
      }
      return arr;
    };
    fetchEvents = function(userId, year, month) {
      var params, range;
      range = getEventsScope(year, month);
      params = {
        scope: 'all',
        range_from: range.firstDay.hour(0).minute(1).format('YYYY-MM-DD HH:mm:ss'),
        range_to: range.lastDay.hour(23).minute(59).format('YYYY-MM-DD HH:mm:ss')
      };
      if (userId === currentUser.id && currentUser.is_pro && $state.current.name === 'app.ownCalendar') {
        params.scope = 'all_with_clients';
      }
      return Restangular.one('users', userId).all('collections/workout_events').getList(params);
    };
    mergeEvents = function(array, events) {
      var array_item, event, event_day, j, len;
      for (j = 0, len = events.length; j < len; j++) {
        event = events[j];
        event_day = moment(event.begins_at);
        array_item = _.find(array, function(i) {
          return moment(i.formatted_date).isSame(event_day, 'day');
        });
        if (array_item) {
          array_item.events.push(event);
        }
      }
      return array;
    };
    return {
      prepare: function(userId, year, month) {
        var array, range;
        range = getEventsScope(year, month);
        array = prepareArray(range.firstDay);
        return $q.when(fetchEvents(userId, year, month)).then((function(_this) {
          return function(events) {
            return mergeEvents(array, events);
          };
        })(this));
      }
    };
  }
]);
;App.factory('calendarFillInService', [
  '$rootScope', '$ionicScrollDelegate', '$stateParams', 'sharedData', 'notificationsService', function($rootScope, $ionicScrollDelegate, $stateParams, sharedData, notificationsService) {
    return {
      buildCalendar: function(dataEvents, myDate) {
        var date, day, event, eventToShow, events, firstWeek, i, j, k, l, lastDay, lastWeek, len, len1, m, maxDay, n, newDay, ref, ref1, ref2, result, scheduleDay, week, weeks;
        dataEvents = dataEvents != null ? dataEvents : dataEvents = [];
        eventToShow;
        weeks = [];
        week = [];
        for (date = j = 1, ref = myDate.daysInMonth(); 1 <= ref ? j <= ref : j >= ref; date = 1 <= ref ? ++j : --j) {
          events = [];
          for (k = 0, len = dataEvents.length; k < len; k++) {
            scheduleDay = dataEvents[k];
            if (scheduleDay.date === date && _.some(scheduleDay.events)) {
              events = scheduleDay.events;
            }
          }
          day = moment(myDate).date(date);
          if (date === 1) {
            week.push({
              day: date,
              week: day.week(),
              events: events
            });
            continue;
          }
          lastWeek = week[week.length - 1].week;
          if (lastWeek === day.week()) {
            week.push({
              day: date,
              week: day.week(),
              events: events
            });
          } else {
            weeks.push(week);
            week = [];
            week.push({
              day: date,
              week: day.week(),
              events: events
            });
          }
          if (date === myDate.daysInMonth()) {
            weeks.push(week);
          }
        }
        firstWeek = weeks[0];
        if (firstWeek.length < 7) {
          maxDay = myDate.clone().subtract(1, 'month').daysInMonth();
          for (i = l = 1, ref1 = 7 - firstWeek.length; 1 <= ref1 ? l <= ref1 : l >= ref1; i = 1 <= ref1 ? ++l : --l) {
            firstWeek.unshift({
              day: maxDay,
              otherMonth: true
            });
            maxDay -= 1;
          }
        }
        lastWeek = weeks[weeks.length - 1];
        if (lastWeek.length < 7) {
          maxDay = myDate.daysInMonth();
          for (i = m = 1, ref2 = 7 - lastWeek.length; 1 <= ref2 ? m <= ref2 : m >= ref2; i = 1 <= ref2 ? ++m : --m) {
            lastDay = weeks[weeks.length - 1][lastWeek.length - 1].day;
            if (lastDay + 1 >= maxDay) {
              newDay = 1;
            } else {
              newDay = lastDay += 1;
            }
            lastWeek.push({
              day: newDay,
              otherMonth: true
            });
          }
        }
        $ionicScrollDelegate.resize();
        $rootScope.$broadcast("loading:hide");
        for (n = 0, len1 = dataEvents.length; n < len1; n++) {
          event = dataEvents[n];
          if (event.date === moment(myDate).date() && event.week === moment(myDate).week()) {
            event.day = event.date;
            eventToShow = event;
          }
        }
        return result = {
          weeks: weeks,
          event: eventToShow
        };
      }
    };
  }
]);
;
;
;
;App.controller("CertCtrl", [
  '$scope', '$state', 'storage', 'certUpload', 'authService', function($scope, $state, storage, certUpload, authService) {
    var initialize;
    initialize = function() {
      var params;
      params = {
        'app.certUpload': {
          title: 'Certifications',
          text: 'Please upload a photo of your personal training certification here.',
          method: function() {
            storage.setKey('cert_upload_is_skipped', true);
            return $state.go('app.onboardingAccount');
          }
        },
        'app.certBlockedAccount': {
          title: 'Certification required',
          text: 'Please upload a photo of your professional certification to continue using GymCloud.',
          method: function() {
            return authService.logout();
          }
        },
        'app.certBlockedClientsAdd': {
          title: 'Certification required',
          text: 'Please upload a photo of your professional certification before adding clients to your GymCloud account.',
          method: function() {
            return $state.go('app.clients');
          }
        }
      }[$state.current.name];
      $scope.title = params.title;
      $scope.text = params.text;
      return $scope.skip = function() {
        return params.method();
      };
    };
    $scope.certUpload = function(file) {
      return certUpload.upload(file);
    };
    return initialize();
  }
]);
;App.factory('certUpload', [
  '$state', 'storage', 'Restangular', 'Upload', function($state, storage, Restangular, Upload) {
    var updateUser, user;
    user = storage.getCurrentUser();
    updateUser = function() {
      return Restangular.one('users', 'me').get().then(function(result) {
        user.user_data = result;
        return storage.setKey('user', user);
      });
    };
    return {
      upload: function(file) {
        var access_token;
        access_token = storage.getCurrentUser().access_token;
        return Upload.upload({
          url: AppConfig.backend_url + "/certificates",
          data: {
            file: file
          },
          method: 'POST',
          headers: {
            'Authorization': "Bearer " + access_token
          }
        }).then(function(resp) {
          updateUser();
          return $state.go('app.certUploaded');
        });
      }
    };
  }
]);
;
;App.controller("CertUploadedCtrl", [
  '$scope', '$state', 'storage', function($scope, $state, storage) {
    var user;
    user = storage.getCurrentUser();
    return $scope.redirect = function() {
      if (!user.user_data.user_settings.is_presets_loaded) {
        return $state.go('app.onboardingAccount');
      } else {
        return $state.go('app.proDashboard');
      }
    };
  }
]);
;
;App.controller('ClientsPerfomanceCtrl', [
  '$scope', 'Restangular', function($scope, Restangular) {
    var initialize;
    initialize = function() {
      return Restangular.one('clients_performance').getList().then(function(clientsList) {
        return $scope.clients = clientsList;
      });
    };
    return initialize();
  }
]);
;
;App.controller("AddParticipantsCtrl", [
  '$scope', '$rootScope', '$state', 'Restangular', 'storage', function($scope, $rootScope, $state, Restangular, storage) {
    var compareClients, initialize;
    initialize = function() {
      $scope.userId = storage.getCurrentUser().user_data.id;
      return Restangular.one('client_groups', $state.params.groupId).get().then(function(group) {
        $scope.clientGroup = group;
        return Restangular.one('users', $scope.userId).one('collections/clients').getList().then(function(clients) {
          $scope.clients = clients;
          return compareClients($scope.clients, $scope.clientGroup);
        });
      });
    };
    compareClients = function(clients, group) {
      var client, groupClient, i, len, results;
      results = [];
      for (i = 0, len = clients.length; i < len; i++) {
        client = clients[i];
        results.push((function() {
          var j, len1, ref, results1;
          ref = group.clients;
          results1 = [];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            groupClient = ref[j];
            if (client.id === groupClient.id) {
              client.is_in_group = true;
              break;
            } else {
              results1.push(client.is_in_group = false);
            }
          }
          return results1;
        })());
      }
      return results;
    };
    $scope.addToGroup = function($event, toAssign, client) {
      var method;
      $event.preventDefault();
      client.is_in_group = !$event.target.checked;
      method = Restangular.one('client_groups', $state.params.groupId).one('members', client.id);
      if (toAssign) {
        return method.post().then(function(assignee) {
          return $event.target.checked = !client.is_in_group;
        });
      } else {
        return method.remove().then(function(assignee) {
          return $event.target.checked = !client.is_in_group;
        });
      }
    };
    $scope.goToGroups = function() {
      $rootScope.fromAddParticipants = true;
      return $state.go('app.clients');
    };
    return initialize();
  }
]);
;
;
;App.controller("ClientGroupCtrl", [
  '$scope', '$state', 'storage', 'Restangular', 'ewpService', function($scope, $state, storage, Restangular, ewpService) {
    $scope.groupId = $state.params.groupId;
    $scope.initialize = function() {
      Restangular.one('client_groups', $scope.groupId).get().then(function(group) {
        return $scope.group = group;
      });
      ewpService.getGroupWorkouts($scope.groupId).then(function(workouts) {
        return $scope.workoutsCount = workouts.length;
      });
      ewpService.getGroupPrograms($scope.groupId).then(function(programs) {
        return $scope.programsCount = programs.length;
      });
      return ewpService.getGroupClients($scope.groupId).then(function(clients) {
        return $scope.clientsCount = clients.length;
      });
    };
    return $scope.initialize();
  }
]);
;
;App.factory('clientsTypeService', [
  'storage', function(storage) {
    return {
      run: function(user) {
        var ref, userType;
        return userType = {
          'Physical Therapist': 'Patients',
          'Coach': 'Athletes',
          'Athletic Trainer': 'Athletes',
          'Personal Trainer': 'Clients'
        }[(ref = user.user_settings) != null ? ref.user_account_type_name : void 0] || 'Clients';
      }
    };
  }
]);
;App.controller("CreateGroupCtrl", [
  '$scope', '$state', 'Restangular', function($scope, $state, Restangular) {
    return $scope.create = function(name) {
      return Restangular.all('client_groups').post({
        name: name
      }).then(function(group) {
        return $state.go('app.addParticipants', {
          groupId: group.id
        });
      });
    };
  }
]);
;
;App.controller("GroupClientsCtrl", [
  '$scope', 'Restangular', '$state', function($scope, Restangular, $state) {
    var initialize;
    initialize = function() {
      $scope.group = Restangular.one('client_groups', $state.params.groupId).get().$object;
      return $scope.clients = Restangular.one('client_groups', $state.params.groupId).one('members').getList().$object;
    };
    return initialize();
  }
]);
;
;App.controller("GroupTemplatesListCtrl", [
  '$scope', '$state', 'Restangular', 'ewpService', function($scope, $state, Restangular, ewpService) {
    var initList, initialize;
    initialize = function() {
      $scope.groupId = $state.params.groupId;
      Restangular.one('client_groups', $scope.groupId).get().then(function(group) {
        return $scope.group = group;
      });
      return initList($state.params.templateType);
    };
    initList = function(type) {
      var param;
      param = {
        'workout-templates': {
          getter: function() {
            return ewpService.getGroupWorkouts($scope.groupId).$object;
          },
          state: 'app.workoutFolderTemplate',
          stateParam: 'workoutId',
          type: 'workouts',
          folderType: 'workout-templates-folder'
        },
        'program-templates': {
          getter: function() {
            return ewpService.getGroupPrograms($scope.groupId).$object;
          },
          state: 'app.programFolderTemplate',
          stateParam: 'programId',
          type: 'programs',
          folderType: 'program-templates-folder'
        }
      }[type];
      $scope.items = param.getter();
      $scope.itemsType = param.type;
      $scope.itemsIcon = "gc-icon-" + param.type;
      return $scope.goToItem = function(item) {
        var stateHash;
        stateHash = {
          templateType: param.folderType,
          folderId: item.folder_id
        };
        stateHash[param.stateParam] = item.id;
        return $state.go(param.state, stateHash);
      };
    };
    return initialize();
  }
]);
;
;App.controller("InviteClientCtrl", [
  '$scope', '$state', 'Restangular', 'storage', 'clientsTypeService', function($scope, $state, Restangular, storage, clientsTypeService) {
    $scope.isInvitation = false;
    $scope.buttonText = 'Save';
    $scope.userType = clientsTypeService.run(storage.getCurrentUser().user_data).toLowerCase();
    $scope.inviteUser = function() {
      $scope.isInvitation = true;
      return $scope.buttonText = 'Save & Invite';
    };
    return $scope.invite = function(data) {
      return Restangular.all('clients').post(data).then(function(client) {
        if (data.email) {
          return Restangular.one('users', client.id).all('invite').post({
            email: data.email
          }).then(function(invite) {
            return $state.go('app.clients');
          });
        } else {
          return $state.go('app.clients');
        }
      });
    };
  }
]);
;
;App.controller("ClientsCtrl", [
  '$scope', '$state', '$rootScope', 'Restangular', 'storage', 'clientsTypeService', '$ionicTabsDelegate', function($scope, $state, $rootScope, Restangular, storage, clientsTypeService, $ionicTabsDelegate) {
    var fetchList, initialize;
    initialize = function() {
      $scope.currentUser = storage.getCurrentUser().user_data;
      $scope.preferredState = 'app.inviteClient';
      $scope.userType = clientsTypeService.run($scope.currentUser);
      fetchList('clients');
      return fetchList('client_groups');
    };
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      if (fromState.name === 'app.inviteClient' && toState.name === 'app.clients') {
        fetchList('clients');
      }
      if (fromState.name === 'app.addParticipants' && toState.name === 'app.clients') {
        return fetchList('client_groups');
      }
    });
    $scope.userId = storage.getCurrentUser().user_data.id;
    fetchList = function(type) {
      return Restangular.one('users', $scope.userId).one('collections', type).getList().then(function(list) {
        if (type === 'clients') {
          $scope.clients = list;
          if (list.length === 1) {
            return $scope.emptyClients = true;
          }
        } else {
          $scope.groups = list;
          if (list.length === 0) {
            return $scope.emptyGroups = true;
          }
        }
      });
    };
    $scope.selectIndividuals = function() {
      return $scope.preferredState = 'app.inviteClient';
    };
    $scope.selectGroups = function() {
      return $scope.preferredState = 'app.createGroup';
    };
    $scope.goToState = function() {
      return $state.go($scope.preferredState);
    };
    return initialize();
  }
]);
;
;
;
;App.controller("ConversationCtrl", [
  '$scope', '$rootScope', '$state', '$ionicScrollDelegate', '$timeout', '$ionicTabsDelegate', 'Restangular', 'storage', 'sendFirstMessageService', 'sendMessageService', function($scope, $rootScope, $state, $ionicScrollDelegate, $timeout, $ionicTabsDelegate, Restangular, storage, sendFirstMessageService, sendMessageService) {
    var clearData, conversationId, footerBar, messagesPage, scroller, viewScroll;
    if ($rootScope.messageCategory) {
      $timeout((function() {
        $ionicTabsDelegate.select($rootScope.messageCategory - 1);
        return $rootScope.messageCategory = void 0;
      }), 0);
    }
    $scope.newMessage = {
      body: void 0,
      attachment: void 0,
      message_category: void 0,
      video_id: void 0,
      video_url: void 0,
      workout_event_id: void 0
    };
    footerBar = void 0;
    scroller = void 0;
    messagesPage = 1;
    viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    $scope.currentUser = storage.getCurrentUser().user_data;
    $scope.conversation = [];
    if ($state.current.name === 'app.proConversation' || $state.current.name === 'app.clientConversation') {
      conversationId = $state.params.conversationId;
    } else {
      conversationId = void 0;
    }
    $scope.isNewConversation = $state.current.name === 'app.newConversation';
    $scope.loadMoreMessages = function(category) {
      var options;
      messagesPage++;
      options = {
        message_category: category,
        per_page: 10,
        page: messagesPage
      };
      return Restangular.one('conversations', conversationId).get(options).then(function(conversation) {
        return $scope.conversation = $scope.conversation.concat(conversation);
      });
    };
    $rootScope.$on('newConversationMessage', function(event, message) {
      if ($scope.newMessage.message_category === message.message_category) {
        $scope.conversation.push(message);
        $scope.$apply();
        return viewScroll.scrollBottom();
      }
    });
    $rootScope.$on('newConversationPush', function(event, data) {
      var message, messageCategory;
      messageCategory = data.additionalData.message_category;
      if (messageCategory !== $scope.newMessage.message_category) {
        $ionicTabsDelegate.select(messageCategory - 1);
      } else {
        message = {
          body: data.message,
          conversation_id: data.additionalData.conversation_id,
          message_category: data.additionalData.message_category
        };
        $scope.conversation.push(message);
        $scope.$apply();
      }
      return viewScroll.scrollBottom();
    });
    $scope.fetchMessages = function(category) {
      var options;
      if (category == null) {
        category = 1;
      }
      if ($rootScope.messageCategory && $rootScope.messageCategory !== category) {
        return false;
      }
      $scope.newMessage.message_category = category;
      if ($scope.isNewConversation) {
        return false;
      }
      options = {
        message_category: category,
        per_page: 10,
        page: 1
      };
      return Restangular.one('conversations', conversationId).get(options).then(function(conversation) {
        $scope.conversation = conversation;
        $scope.isEmptyConversation = conversation.length === 0;
        messagesPage = 1;
        return $timeout((function() {
          return viewScroll.scrollBottom();
        }), 0);
      });
    };
    $scope.attachFile = function(file) {
      return $scope.newMessage.attachment = file;
    };
    $scope.sendFirstMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      $scope.newMessage.body = messageBody;
      return sendFirstMessageService.sendMessage($scope.newMessage, $state.params.recipientId).then(function(message) {
        $scope.isNewConversation = false;
        conversationId = message.conversation_id;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    $scope.sendMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      if ($scope.newMessage.message_category === 2) {
        $scope.newMessage.workout_event_id = $scope.conversation[0].workout_event_id;
      }
      $scope.newMessage.body = messageBody;
      return sendMessageService.sendMessage($scope.newMessage, conversationId).then(function(message) {
        $scope.isEmptyConversation = false;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    $scope.removeAttachment = function() {
      return $scope.newMessage.attachment = void 0;
    };
    clearData = function() {
      $scope.newMessage.body = void 0;
      return $scope.newMessage.attachment = void 0;
    };
    $scope.$on('$ionicView.enter', function() {
      return $timeout((function() {
        footerBar = document.body.querySelector('.bar-footer');
        return scroller = document.body.querySelector('.scroll-content');
      }), 0);
    });
    return $scope.$on('taResize', function(e, ta) {
      var newFooterHeight, taHeight;
      if (!ta) {
        return;
      }
      taHeight = ta[0].offsetHeight;
      if (!footerBar) {
        return;
      }
      newFooterHeight = taHeight + 10;
      newFooterHeight = newFooterHeight > 44 ? newFooterHeight : 44;
      footerBar.style.height = newFooterHeight + "px";
      return scroller.style.bottom = newFooterHeight + "px";
    });
  }
]);
;
;App.controller("ConversationsListCtrl", [
  '$scope', '$state', '$rootScope', 'Restangular', 'storage', 'clientsTypeService', '$ionicTabsDelegate', '$timeout', function($scope, $state, $rootScope, Restangular, storage, clientsTypeService, $ionicTabsDelegate, $timeout) {
    var excludeMyself;
    $scope.initialize = function() {
      $rootScope.conversationRecipient = null;
      $scope.currentUser = storage.getCurrentUser().user_data;
      return Restangular.one('conversations').getList().then(function(conversations) {
        $scope.conversations = conversations;
        $scope.emptyConversations = conversations.length === 0;
        return excludeMyself(conversations);
      });
    };
    excludeMyself = function(conversations) {
      var conversation, i, len, results;
      results = [];
      for (i = 0, len = conversations.length; i < len; i++) {
        conversation = conversations[i];
        results.push(conversation.recipients = _.filter(conversation.recipients, function(item) {
          return item.user_id !== $scope.currentUser.id;
        }));
      }
      return results;
    };
    $scope.deleteConversation = function(id, index) {
      return Restangular.one('conversations', id).remove().then(function() {
        return $scope.conversations.splice(index, 1);
      });
    };
    $scope.goToConversation = function(conversation) {
      $rootScope.conversationRecipient = conversation.recipients[0].full_name;
      $rootScope.messageCategory = conversation.last_message.message_category;
      return $state.go('app.proConversation', {
        conversationId: conversation.id
      });
    };
    return $scope.initialize();
  }
]);
;
;
;
;
;
;
;App.controller("NewConversationRecipientsCtrl", [
  '$scope', '$state', 'Restangular', 'storage', function($scope, $state, Restangular, storage) {
    var initialize;
    initialize = function() {
      $scope.currentUserId = storage.getCurrentUser().user_data.id;
      return Restangular.one('users', $scope.currentUserId).one('collections/clients').getList().then(function(clients) {
        $scope.clients = clients;
        return $scope.emptyClients = clients.length === 1;
      });
    };
    return initialize();
  }
]);
;
;App.factory('sendFirstMessageService', [
  'Restangular', 'Upload', '$state', 'storage', function(Restangular, Upload, $state, storage) {
    var access_token, sendMessageWithImage, sendMessageWithVideo, sendTextMessage;
    access_token = storage.getCurrentUser().access_token;
    sendTextMessage = function(newMessage, recipientId, video_id, video_url) {
      if (video_id == null) {
        video_id = void 0;
      }
      if (video_url == null) {
        video_url = void 0;
      }
      newMessage.video_id = video_id;
      newMessage.video_url = video_url;
      newMessage['recipient_id'] = recipientId;
      return Restangular.one('conversations').customPOST(newMessage).then(function(message) {
        return message;
      });
    };
    sendMessageWithImage = function(newMessage, recipientId) {
      newMessage['recipient_id'] = recipientId;
      return Upload.upload({
        url: AppConfig.backend_url + "/conversations",
        data: newMessage,
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + access_token
        }
      }).then(function(message) {
        return message.data;
      });
    };
    sendMessageWithVideo = function(newMessage, recipientId) {
      return Upload.upload({
        url: AppConfig.backend_url + "/videos",
        data: {
          file: newMessage.attachment,
          name: newMessage.attachment.name
        },
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + access_token
        }
      }).then(function(video) {
        if (newMessage.body == null) {
          newMessage.body = newMessage.attachment.name;
        }
        newMessage.attachment = void 0;
        return sendTextMessage(newMessage, recipientId, video.data.id, video.data.embed_url);
      });
    };
    return {
      sendMessage: function(newMessage, recipientId) {
        var attachmentType, ref, ref1;
        attachmentType = (ref = newMessage.attachment) != null ? (ref1 = ref.type) != null ? ref1.split('/')[0] : void 0 : void 0;
        if (attachmentType === 'image') {
          return sendMessageWithImage(newMessage, recipientId);
        } else if (attachmentType === 'video') {
          return sendMessageWithVideo(newMessage, recipientId);
        } else {
          return sendTextMessage(newMessage, recipientId);
        }
      }
    };
  }
]);
;App.factory('sendMessageService', [
  'Restangular', 'Upload', '$state', 'storage', function(Restangular, Upload, $state, storage) {
    var access_token, sendMessageWithImage, sendMessageWithVideo, sendTextMessage;
    access_token = storage.getCurrentUser().access_token;
    sendTextMessage = function(newMessage, conversationId, video_id, video_url) {
      if (video_id == null) {
        video_id = void 0;
      }
      if (video_url == null) {
        video_url = void 0;
      }
      newMessage.video_id = video_id;
      newMessage.video_url = video_url;
      return Restangular.one('conversations', conversationId).customPOST(newMessage).then(function(message) {
        return message;
      });
    };
    sendMessageWithImage = function(newMessage, conversationId) {
      return Upload.upload({
        url: AppConfig.backend_url + "/conversations/" + conversationId,
        data: newMessage,
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + access_token
        }
      }).then(function(message) {
        return message.data;
      });
    };
    sendMessageWithVideo = function(newMessage, conversationId) {
      return Upload.upload({
        url: AppConfig.backend_url + "/videos",
        data: {
          file: newMessage.attachment,
          name: newMessage.attachment.name
        },
        method: 'POST',
        headers: {
          'Authorization': "Bearer " + access_token
        }
      }).then(function(video) {
        if (newMessage.body == null) {
          newMessage.body = newMessage.attachment.name;
        }
        newMessage.attachment = void 0;
        return sendTextMessage(newMessage, conversationId, video.data.id, video.data.embed_url);
      });
    };
    return {
      sendMessage: function(newMessage, conversationId) {
        var attachmentType, ref, ref1;
        attachmentType = (ref = newMessage.attachment) != null ? (ref1 = ref.type) != null ? ref1.split('/')[0] : void 0 : void 0;
        if (attachmentType === 'image') {
          return sendMessageWithImage(newMessage, conversationId);
        } else if (attachmentType === 'video') {
          return sendMessageWithVideo(newMessage, conversationId);
        } else {
          return sendTextMessage(newMessage, conversationId);
        }
      }
    };
  }
]);
;App.controller("DashboardCtrl", [
  '$scope', '$state', 'Restangular', 'storage', '$q', '$ionicSlideBoxDelegate', 'sharedData', 'notificationsService', function($scope, $state, Restangular, storage, $q, $ionicSlideBoxDelegate, sharedData, notificationsService) {
    var calculateDynamic, fetchDashboard;
    $scope.initialize = function() {
      var dashboardType;
      $scope.webappUrl = AppConfig.webapp_url;
      $scope.user = storage.getCurrentUser();
      $scope.diff = null;
      dashboardType = $scope.user.user_data.is_pro ? 'dashboards/pro' : 'dashboards/client';
      $scope.eventsDynamic = {};
      $q.when(notificationsService.getNotifications(3)).then(function(result) {
        return $scope.notifications = result.notifications.slice(0, 3);
      });
      return fetchDashboard(dashboardType);
    };
    fetchDashboard = function(dashboardType) {
      return Restangular.one(dashboardType).get().then(function(dashboard) {
        dashboard.events_scheduled_today = _.chain(dashboard.events_scheduled_today).sortBy('begins_at').filter(function(ev) {
          return moment(ev.begins_at) > moment();
        }).value();
        $scope.dashboard = dashboard;
        $scope.coefficient = 20 / dashboard.events_scheduled_this_week_count * dashboard.events_completed_this_week_count;
        $ionicSlideBoxDelegate.update();
        return calculateDynamic(dashboard);
      });
    };
    calculateDynamic = function(dashboard) {
      var lastWeek, thisWeek;
      thisWeek = dashboard.events_scheduled_this_week_count;
      lastWeek = dashboard.events_scheduled_last_week_count;
      if (thisWeek > lastWeek) {
        return $scope.eventsDynamic.positive = true;
      } else if (thisWeek < lastWeek) {
        return $scope.eventsDynamic.negative = true;
      } else {
        return $scope.eventsDynamic.equals = true;
      }
    };
    $scope.goToEvent = function(event) {
      return $state.go('app.personalWorkoutEventResults', {
        userId: event.person_id,
        workoutId: event.personal_workout_id,
        eventId: event.id
      });
    };
    $scope.scheduleNewEvent = function() {
      var date;
      date = moment($scope.selectedDay).format();
      sharedData.setEventDate(date);
      return $state.go('app.userNewEvent', {
        userId: $scope.user.user_data.id
      });
    };
    $scope.goToNotification = function(notification) {
      return notificationsService.goToNotification(notification);
    };
    return $scope.initialize();
  }
]);
;
;
;
;
;
;
;
;App.controller("EventCompletedCtrl", [
  '$scope', '$state', 'storage', 'Restangular', function($scope, $state, storage, Restangular) {
    var currentUser, initialize;
    initialize = function() {
      return Restangular.one('personal_workouts', $state.params.workoutId).get().then(function(workout) {
        return $scope.workoutName = workout.name;
      });
    };
    currentUser = storage.getCurrentUser().user_data;
    $scope.userId = $state.params.userId;
    $scope.workoutId = $state.params.workoutId;
    $scope.goToPersonalWorkout = function() {
      if (currentUser.is_pro) {
        return $state.go('app.personalWorkout', {
          userId: $scope.userId,
          workoutId: $state.params.workoutId
        });
      } else {
        return $state.go('app.clientPersonalWorkout', {
          userId: $scope.userId,
          workoutId: $state.params.workoutId
        });
      }
    };
    $scope.exitToDashboard = function() {
      if (currentUser.is_pro) {
        return $state.go('app.proDashboard');
      } else {
        return $state.go('app.clientDashboard');
      }
    };
    return initialize();
  }
]);
;
;App.controller("PersonalWorkoutNewEventCtrl", [
  '$scope', '$state', 'storage', 'Restangular', '$q', '$cordovaDatePicker', 'sharedData', '$ionicHistory', '$ionicLoading', '$timeout', function($scope, $state, storage, Restangular, $q, $cordovaDatePicker, sharedData, $ionicHistory, $ionicLoading, $timeout) {
    var currentUser, initialize, personalWorkoutId, user_is_pro;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(result) {
        return $scope.userName = result;
      });
      $scope.workout = Restangular.one('personal_workouts', $state.params.workoutId).get().$object;
      return Restangular.one('users', $state.params.userId).get().then(function(user) {
        var user_is_pro;
        return user_is_pro = user.is_pro;
      });
    };
    currentUser = storage.getCurrentUser().user_data;
    personalWorkoutId = $state.params.workoutId;
    user_is_pro = null;
    $scope.startDate = moment().toDate();
    $scope.endDate = moment().add(1, 'h').toDate();
    $scope.goBack = function() {
      $ionicHistory.goBack();
      if (typeof cordova !== "undefined" && cordova !== null) {
        return cordova.plugins.Keyboard.close();
      }
    };
    $scope.setEndTime = function(date) {
      return $scope.endDate = moment(date).add(1, 'h').toDate();
    };
    $scope.saveSchedule = function(start, end) {
      var daysDiff, newEvent;
      daysDiff = start > end ? moment(start).diff(moment().startOf('day'), 'days') : moment(start).diff(moment().endOf('day'), 'days');
      start = moment(start).format();
      end = moment(end).add(daysDiff, 'days').format();
      newEvent = {
        personal_workout_id: personalWorkoutId,
        begins_at: start,
        ends_at: end
      };
      return Restangular.all('workout_events').post(newEvent).then(function(event) {
        $timeout((function() {
          return $ionicLoading.show({
            template: 'Event created',
            duration: 3000
          });
        }), 1000);
        sharedData.setEventDate(start);
        if (user_is_pro || !user_is_pro && currentUser.id !== $state.params.userId) {
          return $state.go('app.ownCalendar', {
            userId: $state.params.userId
          });
        } else {
          return $state.go('app.clientCalendar', {
            userId: $state.params.userId
          });
        }
      });
    };
    return initialize();
  }
]);
;
;App.controller("UserNewEventCtrl", [
  '$scope', '$rootScope', '$state', 'storage', 'Restangular', '$q', '$cordovaDatePicker', 'sharedData', '$ionicHistory', '$ionicLoading', '$timeout', function($scope, $rootScope, $state, storage, Restangular, $q, $cordovaDatePicker, sharedData, $ionicHistory, $ionicLoading, $timeout) {
    var initialize;
    initialize = function() {
      var selectedDate, sharedEventDate;
      $scope.currentUser = storage.getCurrentUser();
      sharedEventDate = sharedData.getEventDate();
      selectedDate = sharedEventDate ? moment(sharedEventDate).hour(moment().hour()).minute(moment().minutes()) : moment();
      $scope.startDate = selectedDate.clone().toDate();
      $scope.endDate = selectedDate.clone().add(1, 'h').toDate();
      return Restangular.one('users', $state.params.userId).get().then(function(user) {
        $scope.userName = user.user_profile.first_name + " " + user.user_profile.last_name;
        return $scope.workoutsList = Restangular.one('users', $state.params.userId).one("collections/personal_workouts").getList().$object;
      });
    };
    $scope.setEndTime = function(date) {
      return $scope.endDate = moment(date).add(1, 'h').toDate();
    };
    $scope.goBack = function() {
      $ionicHistory.goBack();
      if (typeof cordova !== "undefined" && cordova !== null) {
        return cordova.plugins.Keyboard.close();
      }
    };
    $scope.saveSchedule = function(workoutId, start, end) {
      var daysDiff, newEvent;
      daysDiff = start > end ? moment(start).diff(moment().startOf('day'), 'days') : moment(start).diff(moment().endOf('day'), 'days');
      start = moment(start).format();
      end = moment(end).add(daysDiff, 'days').format();
      newEvent = {
        personal_workout_id: workoutId,
        begins_at: start,
        ends_at: end
      };
      return Restangular.all('workout_events').post(newEvent).then(function(event) {
        $timeout((function() {
          return $ionicLoading.show({
            template: 'Event created',
            duration: 3000
          });
        }), 1000);
        $rootScope.dateToShow = moment(start);
        if ($scope.currentUser.user_data.is_pro) {
          return $state.go('app.clientCalendar', {
            userId: $state.params.userId
          });
        } else {
          return $state.go('app.ownCalendar', {
            userId: $state.params.userId
          });
        }
      });
    };
    return initialize();
  }
]);
;
;
;
;
;App.controller("PersonalExerciseCtrl", [
  '$scope', '$state', 'storage', 'Restangular', '$q', 'convertPropertiesService', function($scope, $state, storage, Restangular, $q, convertPropertiesService) {
    var initialize;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      Restangular.one('exercises', $state.params.exerciseId).get().then(function(exercise) {
        $scope.exercise = exercise;
        if (!exercise.description && !exercise.video_url) {
          return $scope.isEmpty = true;
        }
      });
      return Restangular.one('exercises', $state.params.exerciseId).one('personal_best', $state.params.userId).get().then(function(bestResults) {
        var i, item, j, len, len1, ref, result;
        for (i = 0, len = bestResults.length; i < len; i++) {
          result = bestResults[i];
          ref = result.exercise_result_items;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            item = ref[j];
            convertPropertiesService.getOneResult(item);
          }
        }
        return $scope.bestResults = bestResults;
      });
    };
    return initialize();
  }
]);
;App.controller("ExerciseTemplateCtrl", [
  '$scope', '$state', 'storage', 'Restangular', '$q', function($scope, $state, storage, Restangular, $q) {
    var initialize;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(result) {
        return $scope.userName = result;
      });
      return Restangular.one('exercises', $state.params.exerciseId).get().then(function(exercise) {
        $scope.exercise = exercise;
        if (!exercise.description && !exercise.video_url) {
          return $scope.isEmpty = true;
        }
      });
    };
    return initialize();
  }
]);
;
;App.controller("WorkoutExerciseCtrl", [
  '$scope', '$state', 'storage', 'Restangular', 'convertPropertiesService', '$q', function($scope, $state, storage, Restangular, convertPropertiesService, $q) {
    var initialize;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      return Restangular.one('workout_exercises', $state.params.exerciseId).get().then(function(exercise) {
        var i, item, j, len, len1, ref, ref1, result;
        $scope.exercise = exercise;
        ref = exercise.exercise_results;
        for (i = 0, len = ref.length; i < len; i++) {
          result = ref[i];
          if (result.is_personal_best) {
            ref1 = result.exercise_result_items;
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              item = ref1[j];
              convertPropertiesService.getOneResult(item);
            }
            $scope.bestResults.push(result);
          }
        }
        if (!exercise.description && !exercise.video_url && $scope.bestResults.length === 0) {
          return $scope.isEmpty = true;
        }
      });
    };
    $scope.bestResults = [];
    return initialize();
  }
]);
;
;App.controller("MenuCtrl", [
  '$scope', '$rootScope', '$state', 'storage', 'authService', '$ionicSideMenuDelegate', '$ionicScrollDelegate', 'menuService', 'ewpService', 'clientsTypeService', 'Restangular', 'proNavigationService', function($scope, $rootScope, $state, storage, authService, $ionicSideMenuDelegate, $ionicScrollDelegate, menuService, ewpService, clientsTypeService, Restangular, proNavigationService) {
    var assignType, createMenuArray, fetchConversations, fetchPro, getClientLibrary;
    $scope.pathHistory = [];
    $scope.menuArray = [];
    $scope.currentLibraryItems = [];
    $scope.isClientLibraryRoot = true;
    if (typeof cordova !== "undefined" && cordova !== null) {
      $scope.isApp = true;
      cordova.getAppVersion.getVersionNumber().then(function(version) {
        return $scope.version = version;
      });
      cordova.getAppVersion.getVersionCode().then(function(build) {
        return $scope.build = build;
      });
    }
    fetchConversations = function() {
      return Restangular.one('conversations').getList().then(function(conversations) {
        var ref;
        $scope.conversationId = (ref = conversations[0]) != null ? ref.id : void 0;
        $scope.noClientConversations = conversations.length === 0;
        return fetchPro();
      });
    };
    fetchPro = function() {
      return Restangular.one('users', $scope.currentUser.id).one('collections/pros').getList().then(function(pros) {
        return $scope.proId = $rootScope.proId = pros[0].id;
      });
    };
    $scope.isBase = function(item) {
      var ref;
      return (ref = item.name) === 'Exercises' || ref === 'Warmup Templates' || ref === 'Workout Templates' || ref === 'Program Templates';
    };
    $scope.prevLevel = function() {
      var prevItem, prevKey;
      prevKey = $scope.pathHistory[$scope.pathHistory.length - 2];
      if (prevKey != null) {
        prevItem = _.find($scope.menuArray, {
          id: prevKey
        });
        $scope.prevItem = prevItem;
        $scope.current_items = prevItem.items;
        return $scope.pathHistory = $scope.pathHistory.slice(0, $scope.pathHistory.length - 1);
      } else {
        $scope.pathHistory = [];
        return $scope.current_items = $scope.menu_data;
      }
    };
    $scope.toggleLevel = function(item) {
      if (item.isFolder) {
        $scope.pathHistory.push(item.id);
        $scope.prevItem = item;
        $scope.current_items = item.items;
        item.isExpanded = !item.isExpanded;
      }
      return $ionicScrollDelegate.resize();
    };
    $scope.goToItem = function(item) {
      $ionicSideMenuDelegate.toggleLeft();
      return proNavigationService.goToItem(item);
    };
    $scope.logOut = function() {
      return authService.logout();
    };
    assignType = function(collection, type) {
      var i, item, len, ref, results;
      ref = collection.items;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        item.type = type;
        if (item.parent_id) {
          results.push(assignType(item, type));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    createMenuArray = function(data) {
      var folder, i, item, j, len, len1, ref, results;
      results = [];
      for (i = 0, len = data.length; i < len; i++) {
        folder = data[i];
        if (folder.items) {
          folder.isFolder = true;
          ref = folder.items;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            item = ref[j];
            item.icon = 'side-menu-icon-' + _.first(item.type.split(' ')).toLowerCase();
          }
          $scope.menuArray.push(folder);
          results.push(createMenuArray(folder.items));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    getClientLibrary = function() {
      ewpService.getPersonalExercises($scope.currentUser.id).then(function(exercises) {
        return $scope.clientExercises = exercises;
      });
      ewpService.getPersonalWarmups($scope.currentUser.id).then(function(warmups) {
        return $scope.clientWarmups = warmups;
      });
      ewpService.getPersonalWorkouts($scope.currentUser.id).then(function(workouts) {
        return $scope.clientWorkouts = workouts;
      });
      return ewpService.getPersonalPrograms($scope.currentUser.id).then(function(programs) {
        return $scope.clientPrograms = programs;
      });
    };
    $scope.showLibraryContent = function(type) {
      var param;
      param = {
        Exercises: {
          content: $scope.clientExercises,
          type: 'ExerciseItem',
          state: 'app.personalExercise',
          stateParam: 'exerciseId'
        },
        Warmups: {
          content: $scope.clientWarmups,
          type: 'WarmupItem',
          state: 'app.clientPersonalWorkout',
          stateParam: 'workoutId'
        },
        Workouts: {
          content: $scope.clientWorkouts,
          type: 'WorkoutItem',
          state: 'app.clientPersonalWorkout',
          stateParam: 'workoutId'
        },
        Programs: {
          content: $scope.clientPrograms,
          type: 'ProgramItem',
          state: 'app.clientPersonalProgram',
          stateParam: 'programId'
        }
      }[type];
      $scope.currentLibraryItems = param.content;
      $scope.prevItem = type;
      $scope.currentLibraryItemsType = param.type;
      $scope.isClientLibraryRoot = false;
      return $scope.goToPersonalItem = function(itemId) {
        var stateHash;
        stateHash = {
          userId: $scope.currentUser.id
        };
        stateHash[param.stateParam] = itemId;
        $state.go(param.state, stateHash);
        return $ionicSideMenuDelegate.toggleLeft();
      };
    };
    $scope.goToPersonalFolder = function(personalType) {
      $ionicSideMenuDelegate.toggleLeft();
      return $state.go('app.personalItemsList', {
        userId: $scope.currentUser.id,
        personalType: personalType
      });
    };
    $scope.goToRootLevel = function() {
      $scope.isClientLibraryRoot = true;
      return $scope.currentLibraryItems = [];
    };
    $scope.doRefresh = function() {
      $scope.currentUser = storage.getCurrentUser().user_data;
      $scope.userType = clientsTypeService.run($scope.currentUser);
      $scope.isTrainer = $scope.currentUser.is_pro;
      if ($scope.isTrainer) {
        return menuService.getData().then(function(data) {
          var folder, i, item, j, len, len1, ref, ref1, type;
          $scope.pathHistory = [];
          $scope.menu_data = [];
          ref = data[0].items;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            switch (item.name) {
              case 'Exercises':
                $scope.menu_data[0] = item;
                $scope.menu_data[0].icon = 'side-menu-icon-exercise';
                $scope.menu_data[0].type = 'Exercises';
                break;
              case 'Warmup Templates':
                $scope.menu_data[1] = item;
                $scope.menu_data[1].icon = 'side-menu-icon-warmup';
                $scope.menu_data[1].type = 'Warmup Templates';
                break;
              case 'Workout Templates':
                $scope.menu_data[2] = item;
                $scope.menu_data[2].icon = 'side-menu-icon-workout';
                $scope.menu_data[2].type = 'Workout Templates';
                break;
              case 'Program Templates':
                $scope.menu_data[3] = item;
                $scope.menu_data[3].icon = 'side-menu-icon-program';
                $scope.menu_data[3].type = 'Program Templates';
            }
          }
          $scope.current_items = $scope.menu_data;
          ref1 = $scope.menu_data;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            folder = ref1[j];
            type = folder.name;
            assignType(folder, type);
          }
          createMenuArray($scope.menu_data);
          return $rootScope.library = $scope.menuArray;
        });
      } else {
        getClientLibrary();
        return fetchConversations();
      }
    };
    $rootScope.$on('userInfoChanged', function(event) {
      return $scope.currentUser = storage.getCurrentUser().user_data;
    });
    $rootScope.$on('userLoggedIn', function(event) {
      return $scope.doRefresh();
    });
    $rootScope.$on('hideNotificationIcon', function(event) {
      return $scope.hideNotifications = true;
    });
    $rootScope.$on('showNotificationIcon', function(event) {
      return $scope.hideNotifications = false;
    });
    $rootScope.$on('onboardingFinished', function(event) {
      return $scope.doRefresh();
    });
    return $scope.doRefresh();
  }
]);
;App.factory('menuService', [
  'Restangular', 'storage', function(Restangular, storage) {
    return {
      getData: function() {
        var user_id;
        user_id = storage.getCurrentUser().user_data.id;
        return Restangular.one('users', user_id).one('collections/library').getList();
      }
    };
  }
]);
;
;
;
;App.factory('proNavigationService', [
  '$state', function($state) {
    return {
      goToItem: function(item) {
        var param, stateHash;
        param = {
          'Exercises': {
            route: 'exercise-templates-folder',
            state: 'app.exerciseTemplate',
            stateParam: 'exerciseId'
          },
          'Warmup Templates': {
            route: 'workout-templates-folder',
            state: 'app.workoutTemplate',
            stateParam: 'workoutId'
          },
          'Workout Templates': {
            route: 'workout-templates-folder',
            state: 'app.workoutTemplate',
            stateParam: 'workoutId'
          },
          'Program Templates': {
            route: 'program-templates-folder',
            state: 'app.programTemplate',
            stateParam: 'programId'
          }
        }[item.type];
        if (item.isFolder) {
          return $state.go('app.templatesList', {
            templateType: param.route,
            folderId: item.id
          });
        } else {
          stateHash = {};
          stateHash[param.stateParam] = item.id;
          return $state.go(param.state, stateHash);
        }
      }
    };
  }
]);
;App.controller("NewTemplateCtrl", [
  '$scope', '$state', function($scope, $state) {
    var initialize;
    initialize = function() {
      return $scope.templateType = $state.params.templateType;
    };
    return initialize();
  }
]);
;
;App.controller("NotificationsCtrl", [
  '$rootScope', '$scope', '$q', 'notificationsService', '$cable', function($rootScope, $scope, $q, notificationsService, $cable) {
    $rootScope.notificationsCount = 0;
    $scope.getNotifications = function() {
      return $q.when(notificationsService.getNotifications(25)).then(function(result) {
        return $scope.notifications = result.notifications;
      });
    };
    $scope.goToNotification = function(notification) {
      return notificationsService.goToNotification(notification);
    };
    return $scope.getNotifications();
  }
]);
;App.factory('notificationsService', [
  '$rootScope', 'Restangular', '$state', 'storage', function($rootScope, Restangular, $state, storage) {
    var comment, goToAssignedItem, goToResults, newEventNotification, userId;
    newEventNotification = {};
    userId = null;
    comment = {
      visible: false,
      commentExerciseId: ''
    };
    goToAssignedItem = function(notification) {
      var param, stateHash;
      param = {
        PersonalWorkout: {
          state: 'app.clientPersonalWorkout',
          stateParam: 'workoutId'
        },
        PersonalProgram: {
          state: 'app.clientPersonalProgram',
          stateParam: 'programId'
        }
      }[notification.trackable_type];
      stateHash = {
        userId: userId
      };
      stateHash[param.stateParam] = notification.trackable_id;
      return $state.go(param.state, stateHash);
    };
    goToResults = function(notification) {
      return $state.go('app.personalWorkoutEventResults', {
        userId: notification.parent.user_id,
        workoutId: notification.parent.personal_workout_id,
        eventId: notification.parent.workout_event_id
      });
    };
    return {
      setNewEventDate: function(notification) {
        newEventNotification.day = moment(notification.parent.begins_at).date();
        return newEventNotification.week = moment(notification.parent.begins_at).week();
      },
      getNewEventDate: function() {
        return newEventNotification;
      },
      getCommentState: function() {
        return comment;
      },
      setCommentState: function() {
        return comment.visible = true;
      },
      getNotifications: function(count) {
        userId = storage.getCurrentUser().user_data.id;
        return Restangular.one('users', userId).all('collections/notifications').getList({
          per_page: count
        }).then(function(notifications) {
          var response;
          response = {
            notifications: [],
            isEmpty: false
          };
          response.notifications = notifications;
          response.isEmpty = notifications.length === 0;
          return response;
        });
      },
      goToNotification: function(notification) {
        if (notification.key === 'exercise_result.create') {
          comment.visible = false;
          goToResults(notification);
        }
        if (notification.key === 'comment.create') {
          comment.visible = true;
          goToResults(notification);
        }
        if (notification.key === 'workout_event.create') {
          Restangular.one('users', notification.recipient_id).get().then(function(user) {
            $rootScope.dateToShow = moment(notification.parent.begins_at);
            if (user.is_pro) {
              return $state.go('app.clientCalendar', {
                userId: notification.owner_id
              });
            } else {
              return $state.go('app.ownCalendar', {
                userId: notification.recipient_id
              });
            }
          });
        }
        if (notification.key === 'user.invitation_accepted') {
          $state.go('app.userProfile', {
            userId: notification.owner_id
          });
        }
        if (notification.key === 'personal_workout.create' || notification.key === 'personal_program.create') {
          return goToAssignedItem(notification);
        }
      }
    };
  }
]);
;
;
;App.controller("OnboardingAccountCtrl", [
  '$scope', '$state', 'Restangular', 'storage', function($scope, $state, Restangular, storage) {
    var initialize;
    initialize = function() {
      return Restangular.one('user_account_types').getList().then(function(accountTypes) {
        $scope.accountTypes = accountTypes;
        return $scope.selectedType = 1;
      });
    };
    $scope.selectType = function(selectedType) {
      var id, method, ref;
      id = (ref = storage.getCurrentUser().user_data.user_settings) != null ? ref.id : void 0;
      method = id ? Restangular.one('user_settings', id).patch : Restangular.one('user_settings').post;
      return method({
        user_account_type_id: selectedType
      }).then(function() {
        return $state.go('app.onboardingPrograms');
      });
    };
    return initialize();
  }
]);
;
;App.controller("OnboardingProgramsCtrl", [
  '$scope', '$state', 'Restangular', 'storage', '$q', function($scope, $state, Restangular, storage, $q) {
    var importPresets, initialize;
    initialize = function() {
      return Restangular.one('program_presets').getList().then(function(presets) {
        var i, len, preset, ref, results;
        $scope.programPresets = presets;
        ref = $scope.programPresets;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          preset = ref[i];
          results.push($scope.toggleGroup(preset));
        }
        return results;
      });
    };
    $scope.toggleGroup = function(preset) {
      var i, len, ref, results, template;
      preset.isSelected = !preset.isSelected;
      ref = preset.program_templates;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        template = ref[i];
        if (template.isChecked == null) {
          results.push(template.isChecked = true);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    importPresets = function() {
      var i, len, preset, ref, results, template_ids;
      ref = $scope.programPresets;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        preset = ref[i];
        if (preset.isSelected) {
          template_ids = _.chain(preset.program_templates).filter(function(template) {
            return !!template.isChecked;
          }).map('id').value();
          results.push(Restangular.one('program_presets', preset.id).post('import', {
            program_template_ids: template_ids
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    $scope.finishOnboarding = function() {
      return $q.all(importPresets()).then(function() {
        return $state.go('app.onboardingSuccess');
      });
    };
    return initialize();
  }
]);
;
;App.controller("OnboardingSuccessCtrl", [
  '$scope', '$rootScope', '$state', 'Restangular', 'storage', function($scope, $rootScope, $state, Restangular, storage) {
    var user_settings;
    user_settings = storage.getCurrentUser().user_data.user_settings;
    return $scope.finishOnboarding = function() {
      return Restangular.one('user_settings', user_settings.id).patch({
        is_presets_loaded: true
      }).then(function() {
        $rootScope.$broadcast('onboardingFinished');
        if (user_settings.is_mobile_tutorial_finished) {
          return $state.go('app.proDashboard');
        } else {
          return $state.go('app.tutorial');
        }
      });
    };
  }
]);
;
;App.controller("TrialEndedCtrl", [
  '$ionicSideMenuDelegate', 'storage', '$scope', function($ionicSideMenuDelegate, storage, $scope) {
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.accessToken = storage.getCurrentUser().access_token;
    return $scope.webappUrl = AppConfig.webapp_url;
  }
]);
;
;App.controller("PersonalItemsListCtrl", [
  '$scope', '$state', 'storage', 'Restangular', '$q', function($scope, $state, storage, Restangular, $q) {
    var getItems, initList, initialize;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      if ($state.params.personalType === 'personal-exercises') {
        return initList('exercise');
      } else if ($state.params.personalType === 'personal-warmups') {
        return initList('warmup');
      } else if ($state.params.personalType === 'personal-workouts') {
        return initList('workout');
      } else if ($state.params.personalType === 'personal-programs') {
        return initList('program');
      }
    };
    getItems = function(collection) {
      return Restangular.one('users', $state.params.userId).one("collections/" + collection).getList().then(function(result) {
        $scope.items = result;
        return $scope.isEmpty = result.length === 0;
      });
    };
    initList = function(type) {
      var param;
      param = {
        exercise: {
          collection: 'personal_exercises',
          state: 'app.personalExercise',
          stateParam: 'exerciseId',
          type: 'exercises'
        },
        warmup: {
          collection: 'personal_warmups',
          state: 'app.personalWorkout',
          stateParam: 'workoutId',
          type: 'warmups'
        },
        workout: {
          collection: 'personal_workouts',
          state: 'app.personalWorkout',
          stateParam: 'workoutId',
          type: 'workouts'
        },
        program: {
          collection: 'personal_programs',
          state: 'app.personalProgram',
          stateParam: 'programId',
          type: 'programs'
        }
      }[type];
      $scope.itemsType = param.type;
      $scope.itemsIcon = "gc-icon-" + param.type;
      getItems(param.collection);
      return $scope.goToItem = function(itemId) {
        var stateHash;
        stateHash = {
          userId: $state.params.userId
        };
        stateHash[param.stateParam] = itemId;
        return $state.go(param.state, stateHash);
      };
    };
    return initialize();
  }
]);
;
;
;
;
;
;App.controller("ProgramCtrl", [
  '$scope', '$state', 'storage', 'Restangular', '$q', function($scope, $state, storage, Restangular, $q) {
    var checkIfEmpty, fetchProgram, fetchProgramWeeks, fetchProgramWorkouts, initialize, itemType;
    itemType = null;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      itemType = {
        'app.programTemplate': 'program_templates',
        'app.programFolderTemplate': 'program_templates',
        'app.personalProgram': 'personal_programs',
        'app.clientPersonalProgram': 'personal_programs'
      }[$state.current.name];
      return fetchProgram();
    };
    fetchProgram = function() {
      return Restangular.one(itemType, $state.params.programId).get({
        nested: false
      }).then(function(program) {
        $scope.program = program;
        fetchProgramWeeks();
        return fetchProgramWorkouts();
      });
    };
    fetchProgramWeeks = function() {
      return Restangular.one(itemType, $state.params.programId).one('program_weeks').get().then(function(weeks) {
        return $scope.program.weeks = weeks;
      });
    };
    fetchProgramWorkouts = function() {
      return Restangular.one(itemType, $state.params.programId).one('program_workouts').get().then(function(workouts) {
        $scope.program.workouts = workouts;
        return $scope.isEmpty = checkIfEmpty();
      });
    };
    $scope.goToWorkout = function(workoutId) {
      if (itemType === 'personal_programs') {
        return $state.go('app.personalProgramWorkout', {
          userId: $state.params.userId,
          programId: $state.params.programId,
          workoutId: workoutId
        });
      } else {
        return $state.go('app.programTemplateOverview', {
          programId: $state.params.programId,
          workoutId: workoutId
        });
      }
    };
    checkIfEmpty = function() {
      return !$scope.program.description && !$scope.program.notes && $scope.program.workouts.length === 0;
    };
    return initialize();
  }
]);
;
;App.controller("ProgramTemplateOverviewCtrl", [
  '$scope', '$state', 'storage', 'Restangular', function($scope, $state, storage, Restangular) {
    var createWorkoutsIndexesArray, fetchCurrentWorkout, fetchWarmup, fetchWorkoutIndex, initialize;
    initialize = function() {
      $scope.videoIsVisible = false;
      return Restangular.one('program_templates', $scope.programId).get().then(function(program) {
        $scope.programName = program.name;
        createWorkoutsIndexesArray(program.workouts);
        fetchWorkoutIndex();
        return fetchCurrentWorkout();
      });
    };
    $scope.programId = $state.params.programId;
    $scope.workoutsIds = {
      idsArray: [],
      prevWorkoutId: false,
      nextWorkoutId: false
    };
    $scope.switchVideo = function() {
      return $scope.videoIsVisible = !$scope.videoIsVisible;
    };
    createWorkoutsIndexesArray = function(workouts) {
      var key, results, value;
      results = [];
      for (key in workouts) {
        value = workouts[key];
        results.push($scope.workoutsIds.idsArray[key] = value.workout_id);
      }
      return results;
    };
    fetchCurrentWorkout = function() {
      return Restangular.one('workout_templates', $state.params.workoutId).get().then(function(workout) {
        $scope.workout = workout;
        if (workout.warmup_id) {
          fetchWarmup(workout.warmup_id);
        }
        if (!workout.description && !workout.notes && workout.exercises.length === 0) {
          return $scope.isEmpty = true;
        }
      });
    };
    fetchWarmup = function(id) {
      return Restangular.one('workout_templates', id).get().then(function(warmup) {
        return $scope.warmup = warmup;
      });
    };
    fetchWorkoutIndex = function() {
      var index;
      index = $scope.workoutsIds.idsArray.indexOf(+$state.params.workoutId);
      if (index > 0) {
        $scope.workoutsIds.prevWorkoutId = $scope.workoutsIds.idsArray[index - 1];
      }
      if (index < $scope.workoutsIds.idsArray.length - 1) {
        return $scope.workoutsIds.nextWorkoutId = $scope.workoutsIds.idsArray[index + 1];
      }
    };
    $scope.goToExercise = function(exercise) {
      return $state.go('app.workoutTemplateExercise', {
        workoutId: $state.params.workoutId,
        exerciseId: exercise.exercise_id
      });
    };
    $scope.goToWarmupOverview = function() {
      return $state.go('app.workoutTemplateWarmups', {
        workoutId: $scope.warmup.id
      });
    };
    return initialize();
  }
]);
;
;
;App.controller("ResultsOverviewCtrl", [
  '$scope', '$rootScope', '$state', 'Restangular', 'storage', '$timeout', 'notificationsService', 'convertPropertiesService', 'sendMessageService', 'sendFirstMessageService', '$ionicScrollDelegate', '$ionicHistory', function($scope, $rootScope, $state, Restangular, storage, $timeout, notificationsService, convertPropertiesService, sendMessageService, sendFirstMessageService, $ionicScrollDelegate, $ionicHistory) {
    var checkCommentFromNotification, clearData, currentUser, eventId, fetchComments, filterComments, footerBar, initialize, scroller, viewScroll;
    initialize = function() {
      $scope.isNewConversation = true;
      return Restangular.one('workout_events', eventId).one('full').get().then(function(result) {
        result.exercises = _.sortBy(result.exercises, 'position');
        convertPropertiesService.get(result);
        $scope.event = result;
        fetchComments();
        return checkCommentFromNotification();
      });
    };
    eventId = +$state.params.eventId;
    $scope.commentsState = notificationsService.getCommentState();
    currentUser = storage.getCurrentUser().user_data;
    viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    footerBar = void 0;
    scroller = void 0;
    $scope.conversation = [];
    $scope.newMessage = {
      body: void 0,
      attachment: void 0,
      message_category: 2,
      video_id: void 0,
      video_url: void 0,
      workout_event_id: eventId
    };
    fetchComments = function() {
      var params, recipient_id;
      recipient_id = currentUser.is_pro ? $state.params.userId : $rootScope.proId;
      params = {
        recipient_id: recipient_id
      };
      return Restangular.one('conversations/by_clients').get(params).then(function(conversation) {
        $scope.isNewConversation = conversation.length === 0;
        if (!$scope.isNewConversation) {
          $scope.conversationId = conversation[0].conversation_id;
        }
        filterComments(conversation);
        return $timeout((function() {
          return viewScroll.scrollBottom();
        }), 0);
      });
    };
    $rootScope.$on('newConversationMessage', function(event, message) {
      if (message.message_category === 2) {
        $scope.conversation.push(message);
        $scope.$apply();
        return viewScroll.scrollBottom();
      }
    });
    $scope.sendFirstMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      $scope.newMessage.body = messageBody;
      return sendFirstMessageService.sendMessage($scope.newMessage, $state.params.userId).then(function(message) {
        $scope.isNewConversation = false;
        $scope.isEmptyConversation = false;
        $scope.conversationId = message.conversation_id;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    $scope.sendMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      $scope.newMessage.body = messageBody;
      return sendMessageService.sendMessage($scope.newMessage, $scope.conversationId).then(function(message) {
        $scope.isEmptyConversation = false;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    filterComments = function(conversation) {
      var i, len, message;
      for (i = 0, len = conversation.length; i < len; i++) {
        message = conversation[i];
        if (message.message_category === 2 && message.workout_event_id === eventId) {
          $scope.conversation.push(message);
        }
      }
      return $scope.isEmptyConversation = $scope.conversation.length === 0;
    };
    checkCommentFromNotification = function() {
      if ($scope.commentsState.visible) {
        return $scope.showComments();
      }
    };
    $scope.showComments = function() {
      $scope.commentsState.visible = true;
      return $timeout((function() {
        $ionicScrollDelegate.resize();
        return viewScroll.scrollBottom();
      }), 0);
    };
    $scope.navAction = function() {
      if ($scope.commentsState.visible) {
        return $scope.hideComments();
      } else {
        return goToProfile();
      }
    };
    $scope.hideComments = function() {
      $scope.commentsState.visible = false;
      return $ionicScrollDelegate.scrollTop();
    };
    clearData = function() {
      var file;
      $scope.newMessage.body = void 0;
      file = void 0;
      return $scope.newMessage.attachment = void 0;
    };
    $scope.goBack = function() {
      if ($scope.commentsState.visible) {
        return $scope.commentsState.visible = false;
      } else {
        return $ionicHistory.goBack();
      }
    };
    $scope.$on('$ionicView.enter', function() {
      return $timeout((function() {
        footerBar = document.body.querySelector('.bar-footer');
        return scroller = document.body.querySelector('.scroll-content');
      }), 0);
    });
    $scope.$on('taResize', function(e, ta) {
      var newFooterHeight, taHeight;
      if (!ta) {
        return;
      }
      taHeight = ta[0].offsetHeight;
      if (!footerBar) {
        return;
      }
      newFooterHeight = taHeight + 10;
      newFooterHeight = newFooterHeight > 44 ? newFooterHeight : 44;
      footerBar.style.height = newFooterHeight + "px";
      return scroller.style.bottom = newFooterHeight + "px";
    });
    $scope.removeLastCommentPadding = function() {
      $scope.commentsPadding = false;
      return $timeout((function() {
        return $ionicScrollDelegate.scrollBottom();
      }), 100);
    };
    $scope.addLastCommentPadding = function() {
      $scope.commentsPadding = true;
      return $timeout((function() {
        return $ionicScrollDelegate.scrollBottom();
      }), 100);
    };
    $scope.removeResultsBottomMargin = function() {
      return $scope.resultsMargin = false;
    };
    $scope.addResultsBottomMargin = function() {
      return $scope.resultsMargin = true;
    };
    return initialize();
  }
]);
;
;
;
;
;
;
;App.controller("PersonalWorkoutEventResultsCtrl", [
  '$scope', '$state', '$timeout', 'storage', 'Restangular', '$q', '$ionicScrollDelegate', 'notificationsService', '$ionicHistory', '$rootScope', '$filter', '$ionicPopup', 'errorsService', 'convertPropertiesService', 'sendMessageService', 'sendFirstMessageService', function($scope, $state, $timeout, storage, Restangular, $q, $ionicScrollDelegate, notificationsService, $ionicHistory, $rootScope, $filter, $ionicPopup, errorsService, convertPropertiesService, sendMessageService, sendFirstMessageService) {
    var checkCommentFromNotification, clearData, currentUser, eventId, fetchComments, filterComments, footerBar, goToCompletedScreen, goToProfile, groupExercises, groupedExercises, initialize, isAndroid, nextExercise, scroller, viewScroll;
    initialize = function() {
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      return Restangular.one('workout_events', eventId).one('full').get().then(function(result) {
        result.exercises = _.sortBy(result.exercises, 'position');
        convertPropertiesService.get(result);
        $scope.workout = result;
        fetchComments();
        groupExercises();
        $scope.currentExercisesGroup = groupedExercises[0];
        $scope.toggleExercise($scope.currentExercisesGroup[0], 0);
        checkCommentFromNotification();
        return $scope.showFinish = groupedExercises.length === 1;
      });
    };
    $scope.userId = $state.params.userId;
    $scope.personalWorkoutId = $state.params.workoutId;
    eventId = +$state.params.eventId;
    groupedExercises = [];
    $scope.disablePrev = true;
    $scope.visibleResultsForm = [];
    $scope.commentsState = notificationsService.getCommentState();
    isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    currentUser = storage.getCurrentUser().user_data;
    viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    footerBar = void 0;
    scroller = void 0;
    $scope.conversation = [];
    $scope.newMessage = {
      body: void 0,
      attachment: void 0,
      message_category: 2,
      video_id: void 0,
      video_url: void 0,
      workout_event_id: eventId
    };
    fetchComments = function() {
      var params, recipient_id;
      recipient_id = currentUser.is_pro ? $scope.userId : $rootScope.proId;
      params = {
        recipient_id: recipient_id
      };
      return Restangular.one('conversations/by_clients').get(params).then(function(conversation) {
        $scope.isNewConversation = conversation.length === 0;
        if (!$scope.isNewConversation) {
          $scope.conversationId = conversation[0].conversation_id;
        }
        filterComments(conversation);
        return $timeout((function() {
          return viewScroll.scrollBottom();
        }), 0);
      });
    };
    $rootScope.$on('newConversationMessage', function(event, message) {
      if (message.message_category === 2) {
        $scope.conversation.push(message);
        $scope.$apply();
        return viewScroll.scrollBottom();
      }
    });
    $scope.sendFirstMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      $scope.newMessage.body = messageBody;
      return sendFirstMessageService.sendMessage($scope.newMessage, $scope.userId).then(function(message) {
        $scope.isNewConversation = false;
        $scope.isEmptyConversation = false;
        $scope.conversationId = message.conversation_id;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    $scope.sendMessage = function(messageBody) {
      $scope.sendingIsBlocked = true;
      $scope.newMessage.body = messageBody;
      return sendMessageService.sendMessage($scope.newMessage, $scope.conversationId).then(function(message) {
        $scope.isEmptyConversation = false;
        $scope.conversation.push(message);
        clearData();
        $scope.sendingIsBlocked = false;
        return viewScroll.scrollBottom();
      });
    };
    filterComments = function(conversation) {
      var i, len, message;
      for (i = 0, len = conversation.length; i < len; i++) {
        message = conversation[i];
        if (message.message_category === 2 && message.workout_event_id === eventId) {
          $scope.conversation.push(message);
        }
      }
      return $scope.isEmptyConversation = $scope.conversation.length === 0;
    };
    goToProfile = function() {
      if (currentUser.is_pro && currentUser.id === $scope.userId) {
        return $state.go('app.myTraining');
      } else if (currentUser.is_pro && currentUser.id !== $scope.userId) {
        return $state.go('app.userProfile', {
          userId: $scope.userId
        });
      } else {
        return $state.go('app.clientDashboard');
      }
    };
    $scope.toggleExercise = function(exercise, index) {
      $ionicScrollDelegate.scrollTop();
      if ($scope.isExerciseShown(exercise)) {
        $scope.shownExercise = null;
      } else {
        $scope.shownExercise = exercise;
      }
      return $ionicScrollDelegate.resize();
    };
    $scope.isExerciseShown = function(exercise) {
      return $scope.shownExercise === exercise;
    };
    $scope.leaveResults = function() {
      var confirmPopup;
      if ($scope.workout.is_completed) {
        return $ionicHistory.goBack();
      } else {
        confirmPopup = $ionicPopup.confirm({
          title: 'You are aborting this workout',
          template: 'Aborting this workout will delete your session data. Are you sure you want to abort this workout?'
        });
        return confirmPopup.then(function(res) {
          if (res) {
            return Restangular.one('workout_events', eventId).remove().then((function() {
              return goToProfile();
            }), function(error) {
              return alert(error);
            });
          }
        });
      }
    };
    $scope.overviewWorkout = function() {
      $rootScope.$broadcast('hideNotificationIcon');
      return $state.go('app.resultsWorkoutOverview', {
        userId: $scope.userId,
        workoutId: $scope.personalWorkoutId
      });
    };
    $scope.showResultsForm = function(index) {
      $scope.visibleResultsForm[index] = true;
      return $ionicScrollDelegate.resize();
    };
    groupExercises = function() {
      var exercise, groupArrayIndex, i, index, len, ref, results1;
      groupArrayIndex = 0;
      ref = $scope.workout.exercises;
      results1 = [];
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        exercise = ref[index];
        exercise.newResult = [];
        exercise.isPersonalBest = false;
        if (index === 0) {
          groupedExercises[groupArrayIndex] = [];
          groupedExercises[groupArrayIndex].push(exercise);
          continue;
        } else {
          if (exercise.order_name && exercise.order_name.charAt(0) === $scope.workout.exercises[index - 1].order_name.charAt(0)) {
            results1.push(groupedExercises[groupArrayIndex].push(exercise));
          } else {
            groupArrayIndex++;
            groupedExercises[groupArrayIndex] = [];
            results1.push(groupedExercises[groupArrayIndex].push(exercise));
          }
        }
      }
      return results1;
    };
    $scope.toggleNewPersonalBest = function(exercise) {
      return exercise.isPersonalBest = !exercise.isPersonalBest;
    };
    $scope.hideNewResultCard = function(exercise, index) {
      $scope.visibleResultsForm[index] = false;
      exercise.newResult = [];
      return exercise.isPersonalBest = false;
    };
    $scope.saveResult = function(exercise, index) {
      var key, newResult, ref, results, value;
      if (exercise.newResult.length === 0) {
        errorsService.errorAlert('Fields are blank', 'Enter results before saving data.');
        return;
      }
      newResult = {
        workout_event_id: eventId,
        workout_exercise_id: exercise.workout_exercise_id,
        is_personal_best: exercise.isPersonalBest
      };
      results = exercise.exercise_results;
      exercise.exercise_properties = $filter('orderBy')(exercise.exercise_properties, "position");
      ref = exercise.newResult;
      for (key in ref) {
        value = ref[key];
        exercise.exercise_properties[key].new_result = value;
      }
      convertPropertiesService.set(exercise);
      $scope.visibleResultsForm[index] = false;
      return Restangular.all('exercise_results').post(newResult).then(function(result) {
        var i, len, property, ref1, resultItem, results1;
        results.push(result);
        ref1 = exercise.exercise_properties;
        results1 = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          property = ref1[i];
          if (property.new_result !== "") {
            resultItem = {
              exercise_property_id: property.id,
              value: property.new_result
            };
            results1.push(Restangular.one('exercise_results', result.id).post('items', resultItem).then(function(item) {
              convertPropertiesService.getOneResult(item);
              results[results.length - 1].exercise_result_items.push(item);
              return exercise.newResult = [];
            }));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      });
    };
    $scope.updateResult = function(property) {
      return Restangular.one('exercise_results', property.exercise_result_id).one('items', property.id).patch({
        value: property.value
      });
    };
    $scope.scrollToInput = function(event) {
      if (isAndroid) {
        return $timeout((function() {
          return $ionicScrollDelegate.scrollBottom();
        }), 700);
      } else {
        return false;
      }
    };
    $scope.togglePersonalBest = function(result) {
      result.is_personal_best = !result.is_personal_best;
      return Restangular.one('exercise_results', result.id).patch({
        is_personal_best: result.is_personal_best
      });
    };
    $scope.deleteResult = function(exercise, result, index) {
      return Restangular.one('exercise_results', result.id).remove().then(function(result) {
        return exercise.exercise_results.splice(index, 1);
      });
    };
    nextExercise = function(currentExercisesGroup) {
      var index;
      $scope.hideComments();
      index = groupedExercises.indexOf(currentExercisesGroup);
      $scope.newResult = [];
      if (index >= 0 && index < groupedExercises.length - 1) {
        $scope.currentExercisesGroup = groupedExercises[index + 1];
        if ($scope.shownExercise !== $scope.currentExercisesGroup[0] && $scope.currentExercisesGroup.length === 1) {
          $scope.toggleExercise($scope.currentExercisesGroup[0], 0);
        }
        $scope.disablePrev = false;
        $ionicScrollDelegate.scrollTop();
        return $scope.showFinish = index === groupedExercises.length - 2;
      }
    };
    $scope.saveAndGoNextExercise = function(currentExercisesGroup) {
      var exercise, i, len;
      for (i = 0, len = currentExercisesGroup.length; i < len; i++) {
        exercise = currentExercisesGroup[i];
        if (exercise.newResult.length > 0) {
          $scope.saveResult(exercise);
        }
      }
      return nextExercise(currentExercisesGroup);
    };
    $scope.prevExercise = function(currentExercisesGroup) {
      var index;
      index = groupedExercises.indexOf(currentExercisesGroup);
      if (index > 0 && index <= groupedExercises.length - 1) {
        $scope.hideComments();
        $scope.currentExercisesGroup = groupedExercises[index - 1];
        if ($scope.shownExercise !== $scope.currentExercisesGroup[0] && $scope.currentExercisesGroup.length === 1) {
          $scope.toggleExercise($scope.currentExercisesGroup[0], 0);
        }
        $ionicScrollDelegate.scrollTop();
        $scope.showFinish = false;
        return $scope.disablePrev = index === 1;
      }
    };
    checkCommentFromNotification = function() {
      if ($scope.commentsState.visible) {
        return $scope.showComments();
      }
    };
    $scope.showComments = function() {
      $scope.commentsState.visible = true;
      return $timeout((function() {
        return viewScroll.scrollBottom();
      }), 0);
    };
    $scope.navAction = function() {
      if ($scope.commentsState.visible) {
        return $scope.hideComments();
      } else {
        return goToProfile();
      }
    };
    $scope.hideComments = function() {
      $scope.commentsState.visible = false;
      return $ionicScrollDelegate.scrollTop();
    };
    goToCompletedScreen = function() {
      return $state.go('app.eventCompleted', {
        userId: $scope.userId,
        workoutId: $scope.personalWorkoutId,
        eventId: eventId
      });
    };
    clearData = function() {
      var file;
      $scope.newMessage.body = void 0;
      file = void 0;
      return $scope.newMessage.attachment = void 0;
    };
    $scope.finish = function() {
      if ($scope.workout.is_completed) {
        return goToCompletedScreen();
      } else {
        return Restangular.one('workout_events', eventId).patch({
          is_completed: true
        }).then(function() {
          return goToCompletedScreen();
        });
      }
    };
    $scope.$on('$ionicView.enter', function() {
      return $timeout((function() {
        footerBar = document.body.querySelector('.bar-footer');
        return scroller = document.body.querySelector('.scroll-content');
      }), 0);
    });
    $scope.$on('taResize', function(e, ta) {
      var newFooterHeight, taHeight;
      if (!ta) {
        return;
      }
      taHeight = ta[0].offsetHeight;
      if (!footerBar) {
        return;
      }
      newFooterHeight = taHeight + 10;
      newFooterHeight = newFooterHeight > 44 ? newFooterHeight : 44;
      footerBar.style.height = newFooterHeight + "px";
      return scroller.style.bottom = newFooterHeight + "px";
    });
    $scope.removeLastCommentPadding = function() {
      $scope.commentsPadding = false;
      return $timeout((function() {
        return $ionicScrollDelegate.scrollBottom();
      }), 100);
    };
    $scope.addLastCommentPadding = function() {
      $scope.commentsPadding = true;
      return $timeout((function() {
        return $ionicScrollDelegate.scrollBottom();
      }), 100);
    };
    $scope.removeResultsBottomMargin = function() {
      return $scope.resultsMargin = false;
    };
    $scope.addResultsBottomMargin = function() {
      return $scope.resultsMargin = true;
    };
    return initialize();
  }
]);
;
;App.controller("GetProCtrl", [
  '$scope', '$state', 'Restangular', function($scope, $state, Restangular) {
    return $scope.getPro = function(selectionType) {
      if (selectionType === 'invite') {
        return $state.go('invitePro');
      } else if (selectionType === 'find') {
        return Restangular.all('pros/request').post().then(function(result) {
          return $state.go('proRequestSent');
        });
      }
    };
  }
]);
;
;App.controller("InviteProCtrl", [
  '$scope', '$state', 'Restangular', function($scope, $state, Restangular) {
    return $scope.invitePro = function(pro) {
      return Restangular.all('pros').post(pro).then(function(result) {
        return Restangular.all('pros/invitation').post().then(function(result) {
          return $state.go('proInvitationSent');
        });
      });
    };
  }
]);
;
;
;
;
;App.controller("WaitingInvitedProCtrl", [
  '$scope', '$state', 'Restangular', function($scope, $state, Restangular) {
    return $scope.sendReminder = function() {
      return Restangular.all('pros/invitation').post().then(function(result) {
        return $state.go('signIn');
      });
    };
  }
]);
;
;App.controller("TemplatesListCtrl", [
  '$scope', '$rootScope', '$state', 'storage', '$q', function($scope, $rootScope, $state, storage, $q) {
    var initialize, state, stateParam;
    state = null;
    stateParam = null;
    initialize = function() {
      $scope.icon = null;
      return $q.when(storage.getUserName()).then(function(name) {
        var iconType;
        $scope.userName = name;
        $scope.currentFolder = _.find($rootScope.library, ['id', +$state.params.folderId]);
        $scope.newTemplateType = _.first($state.params.templateType.split('-'));
        iconType = _.last($scope.currentFolder.icon.split('-'));
        $scope.icon = "gc-icon-" + iconType + "s";
        state = "app." + $scope.newTemplateType + "FolderTemplate";
        return stateParam = $scope.newTemplateType + "Id";
      });
    };
    $scope.goToItem = function(item) {
      var stateHash;
      if (item.isFolder) {
        return $state.go('app.templatesList', {
          templateType: $state.params.templateType,
          folderId: item.id
        });
      } else {
        stateHash = {
          templateType: $state.params.templateType,
          folderId: item.id
        };
        stateHash[stateParam] = item.id;
        return $state.go(state, stateHash);
      }
    };
    return initialize();
  }
]);
;
;App.controller("TestCtrl", [
  '$scope', function($scope) {
    var initialize;
    initialize = function() {
      return $scope.userData = {
        user1: {
          name: 'User 1',
          avatar: 'img/avatar.png'
        },
        user2: {
          name: 'User 2',
          avatar: 'img/avatar.png'
        },
        user3: {
          name: 'User 3',
          avatar: 'img/avatar.png'
        }
      };
    };
    return initialize();
  }
]);
;
;App.factory('slideContent', function() {
  return {
    pro: function() {
      return {
        slide1: {
          title: 'Dashboard to menu',
          text: 'The GymCloud App lets you add and manage your fitness-related information, from clients to workout programs.',
          image: 'img/tutorials/pro/dashboard-to-menu.png'
        },
        slide2: {
          title: 'Adding clients and creating and creating client groups',
          text: 'The Gymcloud App allows you to add clients and organize your client list by creating groups.',
          image: 'img/tutorials/pro/add-clients.png'
        },
        slide3: {
          title: 'Assigning workouts and programs',
          text: 'Assigning workouts and programs with your smartphone is one of many valuable GymCloud features.\u2028',
          image: 'img/tutorials/pro/assign-workouts-programs.png'
        },
        slide4: {
          title: 'Scheduling workouts and programs',
          text: 'With our mobile app, you can now set your clients’ workout and program schedules with just a few clicks.',
          image: 'img/tutorials/pro/schedule-workouts-programs.png'
        },
        slide5: {
          title: 'Entering Results',
          text: 'Lastly, you can also keep track of your clients’ fitness progress by recording their workout results.',
          image: 'img/tutorials/pro/entering-results.png'
        }
      };
    },
    client: function() {
      return {
        slide1: {
          title: 'Dashboard to menu',
          text: 'The GymCloud app lets you work closely with your fitness professional, enabling you to set your fitness schedule and record your workout results.',
          image: 'img/tutorials/client/dashboard-to-menu.png'
        },
        slide2: {
          title: 'Schedule workouts and programs',
          text: 'The GymCloud App allows you to set your workout and program schedules in advance.\u2028',
          image: 'img/tutorials/client/schedule-workouts-programs.png'
        },
        slide3: {
          title: 'Entering workout results',
          text: 'Our mobile app also lets you record your workout results, allowing you to keep track of your fitness progress.\u2028',
          image: 'img/tutorials/client/entering-results.png'
        }
      };
    }
  };
});
;App.controller("TutorialsCtrl", [
  '$scope', '$state', 'storage', 'Restangular', 'slideContent', function($scope, $state, storage, Restangular, slideContent) {
    var initialize;
    initialize = function() {
      $scope.options = {
        loop: false,
        effect: 'fade',
        speed: 500,
        nextButton: '.gc-submit-btn'
      };
      $scope.user = storage.getCurrentUser().user_data;
      return $scope.tutorial = $scope.user.is_pro ? slideContent.pro() : slideContent.client();
    };
    $scope.$on('$ionicSlides.sliderInitialized', function(event, data) {
      return $scope.slider = data.slider;
    });
    $scope.finishTutorial = function() {
      return Restangular.one('user_settings', $scope.user.user_settings.id).patch({
        is_mobile_tutorial_finished: true
      }).then(function() {
        if ($scope.user.is_pro) {
          return $state.go('app.proDashboard');
        } else {
          return $state.go('app.clientDashboard');
        }
      });
    };
    $scope.nextSlide = function() {
      if ($scope.slider.isEnd) {
        return $scope.finishTutorial();
      }
    };
    return initialize();
  }
]);
;
;App.controller("ProfileEditCtrl", [
  '$scope', '$rootScope', '$state', 'storage', 'Restangular', 'Upload', 'certUpload', function($scope, $rootScope, $state, storage, Restangular, Upload, certUpload) {
    var sessionUser, updateStoredUser;
    $scope.initialize = function() {
      return Restangular.one('users/me').get().then(function(result) {
        var ref;
        $scope.user = result.user_profile;
        $scope.accountType = (ref = result.user_settings) != null ? ref.user_account_type_name : void 0;
        $scope.userProfile = result.user_profile;
        $scope.bodyStats = [
          {
            label: 'Weight',
            property: 'weight',
            value: +$scope.userProfile.weight,
            unit: 'lbs'
          }, {
            label: 'Height',
            property: 'height',
            feets: Math.floor(+$scope.userProfile.height / 12),
            inches: +$scope.userProfile.height % 12,
            unit: 'ft\' in"'
          }, {
            label: 'Bodyfat',
            property: 'bodyfat',
            value: +$scope.userProfile.bodyfat,
            unit: '%'
          }
        ];
        $scope.generalInfo = [
          {
            label: 'First Name',
            property: 'first_name',
            value: $scope.userProfile.first_name
          }, {
            label: 'Last Name',
            property: 'last_name',
            value: $scope.userProfile.last_name
          }
        ];
        return $scope.birthday = {
          label: 'Birthday',
          property: 'birthday',
          value: moment($scope.userProfile.birthday).toDate()
        };
      });
    };
    sessionUser = storage.getCurrentUser();
    updateStoredUser = function(user) {
      sessionUser.user_data.user_profile = user;
      return $rootScope.$broadcast('userInfoChanged');
    };
    $scope.uploadAvatar = function(file) {
      var access_token;
      access_token = storage.getCurrentUser().access_token;
      return Upload.upload({
        url: AppConfig.backend_url + "/user_profiles/" + $scope.userProfile.id + "/avatar",
        data: {
          avatar: file
        },
        method: 'PATCH',
        headers: {
          'Authorization': "Bearer " + access_token
        }
      }).then((function(user) {
        updateStoredUser(user);
        return $scope.userProfile.avatar.large.url = user.data.avatar.large.url;
      }), function(resp) {
        return console.log('Error status: ' + resp.status);
      });
    };
    $scope.certUpload = function(file) {
      return certUpload.upload(file);
    };
    $scope.saveHeight = function(unit, value) {
      var height;
      height = $scope.bodyStats[1];
      height[unit] = +value;
      $scope.user['height'] = height['feets'] * 12 + height['inches'];
      return Restangular.one('user_profiles', $scope.userProfile.id).patch($scope.user).then(function(user) {
        return updateStoredUser(user);
      });
    };
    $scope.saveInfo = function(property, value) {
      $scope.user[property] = value;
      return Restangular.one('user_profiles', $scope.userProfile.id).patch($scope.user).then(function(user) {
        return updateStoredUser(user);
      });
    };
    return $scope.initialize();
  }
]);
;
;
;
;App.controller("UserProfileCtrl", [
  '$scope', '$state', 'storage', 'Restangular', 'ewpService', function($scope, $state, storage, Restangular, ewpService) {
    var countWorkouts;
    $scope.userId = $state.params.userId || storage.getCurrentUser().user_data.id;
    $scope.user_is_pro = $state.params.userId == null;
    $scope.initialize = function() {
      Restangular.one('users', $scope.userId).get().then(function(user) {
        $scope.user = user;
        if (user.user_profile.height) {
          return $scope.userHeight = {
            feets: Math.floor(+user.user_profile.height / 12),
            inches: +user.user_profile.height % 12
          };
        }
      });
      ewpService.getPersonalExercises($scope.userId).then(function(exercises) {
        return $scope.exercisesCount = exercises.length;
      });
      ewpService.getPersonalWarmups($scope.userId).then(function(warmups) {
        return $scope.warmupsCount = warmups.length;
      });
      ewpService.getPersonalWorkouts($scope.userId).then(function(workouts) {
        return countWorkouts(workouts);
      });
      return ewpService.getPersonalPrograms($scope.userId).then(function(programs) {
        return $scope.programsCount = programs.length;
      });
    };
    countWorkouts = function(workouts) {
      var i, len, results, workout;
      $scope.programWorkoutsCount = 0;
      $scope.personalWorkoutsCount = 0;
      results = [];
      for (i = 0, len = workouts.length; i < len; i++) {
        workout = workouts[i];
        if (workout.is_program_part) {
          results.push($scope.programWorkoutsCount++);
        } else {
          results.push($scope.personalWorkoutsCount++);
        }
      }
      return results;
    };
    $scope.calculateAge = function(birthday) {
      if (birthday != null) {
        return moment().diff(birthday, 'years');
      }
    };
    $scope.navigateToCalendar = function() {
      if ($scope.user.is_pro && $state.current.name !== 'app.myTraining') {
        return $state.go('app.ownCalendar', {
          userId: $scope.userId
        });
      } else {
        return $state.go('app.clientCalendar', {
          userId: $scope.userId
        });
      }
    };
    return $scope.initialize();
  }
]);
;
;App.controller('ClientVideoLibraryCtrl', [
  '$scope', '$state', 'Restangular', function($scope, $state, Restangular) {
    $scope.initialize = function() {
      var params;
      params = {
        page: 1,
        per_page: 25,
        user_id: $state.params.userId
      };
      return Restangular.all('videos').getList(params).then(function(result) {
        return $scope.videos = result[1];
      });
    };
    return $scope.initialize();
  }
]);
;
;App.controller('VideoEditCtrl', [
  '$rootScope', '$scope', '$state', '$filter', 'Restangular', '$ionicPopup', function($rootScope, $scope, $state, $filter, Restangular, $ionicPopup) {
    var initialize;
    initialize = function() {
      $rootScope.$broadcast('hideNotificationIcon');
      $scope.$on('$ionicView.leave', function() {
        return $rootScope.$broadcast('showNotificationIcon');
      });
      return Restangular.one('videos', $state.params.videoId).get().then(function(video) {
        video.name = $filter('removeExtension')(video.name);
        return $scope.video = video;
      });
    };
    $scope.updateName = function(name) {
      return Restangular.one('videos', $state.params.videoId).patch({
        name: name
      });
    };
    $scope.deleteVideo = function() {
      var confirmPopup;
      confirmPopup = $ionicPopup.confirm({
        title: 'Delete video',
        template: 'Are you sure you want to delete this video?'
      });
      return confirmPopup.then(function(res) {
        if (res) {
          return Restangular.one('videos', $state.params.videoId).remove().then((function() {
            return $state.go('app.videoLibrary');
          }), function(error) {
            return alert(error);
          });
        }
      });
    };
    return initialize();
  }
]);
;
;App.controller('VideoLibraryCtrl', [
  '$scope', 'Restangular', 'storage', 'Upload', '$ionicPopup', '$timeout', function($scope, Restangular, storage, Upload, $ionicPopup, $timeout) {
    var access_token, response;
    $scope.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    access_token = storage.getCurrentUser().access_token;
    $scope.initialize = function() {
      var params;
      params = {
        page: 1,
        per_page: 25
      };
      return Restangular.all('videos').getList(params).then(function(result) {
        return $scope.videos = result[1];
      });
    };
    response = function(res) {
      var error;
      error = JSON.parse(res).error;
      if (error) {
        return alert(error);
      }
    };
    $scope.showPopup = function() {
      var confirmPopup;
      return confirmPopup = $ionicPopup.alert({
        title: 'Select one of the options',
        cssClass: 'select-video-popup',
        buttons: [
          {
            text: 'Take Photo or Video',
            onTap: function(e) {
              return $timeout(function() {
                var cameraInput;
                cameraInput = angular.element(document.querySelector('#open-camera'));
                return cameraInput.triggerHandler('click');
              });
            }
          }, {
            text: 'Photo Library',
            onTap: function(e) {
              var url;
              url = AppConfig.backend_url + "/videos";
              return window.plugins.iOSVideoUploader.getVideo(response, alert, url, access_token);
            }
          }, {
            text: 'Cancel',
            onTap: function(e) {
              return confirmPopup.close();
            }
          }
        ]
      });
    };
    $scope.uploadVideo = function(file) {
      if (!file) {
        return false;
      }
      return Upload.upload({
        url: AppConfig.backend_url + "/videos",
        headers: {
          Authorization: "Bearer " + access_token
        },
        data: {
          file: file,
          name: file.name
        },
        method: 'POST'
      }).success(function(user) {
        return $scope.initialize();
      });
    };
    return $scope.initialize();
  }
]);
;
;
;
;
;
;App.controller("PersonalWorkoutCtrl", [
  '$rootScope', '$scope', '$state', 'storage', 'Restangular', '$q', 'convertPropertiesService', function($rootScope, $scope, $state, storage, Restangular, $q, convertPropertiesService) {
    var createWorkoutsIndexesArray, fetchWarmup, fetchWorkout, getProgram, getWorkoutIndex, initialize;
    console.log('perswork');
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name === 'app.personalWorkoutEventResults') {
        return $rootScope.$broadcast('showNotificationIcon');
      }
    });
    initialize = function() {
      $scope.videoIsVisible = false;
      $scope.userId = $state.params.userId;
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      return fetchWorkout();
    };
    fetchWorkout = function() {
      return Restangular.one('personal_workouts', $state.params.workoutId).get().then(function(workout) {
        convertPropertiesService.get(workout);
        $scope.workout = workout;
        if (workout.warmup_id) {
          fetchWarmup(workout.warmup_id);
        }
        if (!workout.description && !workout.note && workout.exercises.length === 0) {
          return $scope.isEmpty = true;
        }
      });
    };
    fetchWarmup = function(id) {
      return Restangular.one('personal_workouts', id).get().then(function(warmup) {
        return $scope.warmup = warmup;
      });
    };
    $scope.switchVideo = function() {
      return $scope.videoIsVisible = !$scope.videoIsVisible;
    };
    $scope.goToExercise = function(exercise) {
      return $state.go('app.workoutExercise', {
        userId: $scope.userId,
        exerciseId: exercise.id
      });
    };
    $scope.createEvent = function() {
      var diff, end, newEvent, start;
      diff = 30 - moment().minute();
      if (diff < 0) {
        diff = 30 + diff;
      }
      start = moment().add(diff, 'minutes').format();
      end = moment(start).add(1, 'hours').format();
      newEvent = {
        personal_workout_id: $state.params.workoutId,
        begins_at: start,
        ends_at: end
      };
      return Restangular.all('workout_events').post(newEvent).then(function(event) {
        return $state.go('app.personalWorkoutEventResults', {
          userId: $scope.userId,
          workoutId: $state.params.workoutId,
          eventId: event.id
        });
      });
    };
    $scope.goToWarmupOverview = function() {
      return $state.go('app.personalWorkout', {
        userId: $scope.userId,
        workoutId: $scope.warmup.id
      });
    };
    getProgram = function() {
      return Restangular.one('personal_programs', $scope.programId).get().then(function(program) {
        createWorkoutsIndexesArray(program.workouts);
        return getWorkoutIndex();
      });
    };
    createWorkoutsIndexesArray = function(workouts) {
      var key, results, value;
      results = [];
      for (key in workouts) {
        value = workouts[key];
        results.push($scope.workoutsIds.idsArray[key] = value.workout_id);
      }
      return results;
    };
    getWorkoutIndex = function() {
      var index;
      index = $scope.workoutsIds.idsArray.indexOf(+$state.params.workoutId);
      if (index > 0) {
        $scope.workoutsIds.prevWorkoutId = $scope.workoutsIds.idsArray[index - 1];
      }
      if (index < $scope.workoutsIds.idsArray.length - 1) {
        return $scope.workoutsIds.nextWorkoutId = $scope.workoutsIds.idsArray[index + 1];
      }
    };
    if ($state.params.programId) {
      $scope.programId = $state.params.programId;
      $scope.workoutsIds = {
        idsArray: [],
        prevWorkoutId: false,
        nextWorkoutId: false
      };
      getProgram();
    }
    return initialize();
  }
]);
;
;App.controller("ResultsWorkoutOverviewCtrl", [
  '$rootScope', '$scope', '$state', 'storage', 'Restangular', 'convertPropertiesService', '$q', function($rootScope, $scope, $state, storage, Restangular, convertPropertiesService, $q) {
    var initialize;
    initialize = function() {
      var personalWorkoutId;
      $scope.userId = $state.params.userId;
      personalWorkoutId = $state.params.workoutId;
      $scope.videoIsVisible = false;
      $q.when(storage.getUserName()).then(function(name) {
        return $scope.userName = name;
      });
      return Restangular.one('personal_workouts', $state.params.workoutId).get().then(function(workout) {
        convertPropertiesService.get(workout);
        $scope.workout = workout;
        if (!workout.description && !workout.note && workout.exercises.length === 0) {
          return $scope.isEmpty = true;
        }
      });
    };
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name === 'app.personalWorkoutEventResults') {
        return $rootScope.$broadcast('showNotificationIcon');
      }
    });
    $scope.switchVideo = function() {
      return $scope.videoIsVisible = !$scope.videoIsVisible;
    };
    return initialize();
  }
]);
;App.controller("WorkoutTemplateCtrl", [
  '$scope', 'storage', 'Restangular', '$state', '$q', 'convertPropertiesService', function($scope, storage, Restangular, $state, $q, convertPropertiesService) {
    var fetchWarmup, fetchWorkout, initialize;
    initialize = function() {
      $scope.videoIsVisible = false;
      $q.when(storage.getUserName()).then(function(result) {
        return $scope.userName = result;
      });
      return fetchWorkout();
    };
    fetchWorkout = function() {
      return Restangular.one('workout_templates', $state.params.workoutId).get().then(function(workout) {
        convertPropertiesService.get(workout);
        $scope.workout = workout;
        if (workout.warmup_id) {
          fetchWarmup(workout.warmup_id);
        }
        $scope.templateType = workout.is_warmup ? 'warmup' : 'workout';
        if (!workout.description && !workout.note && !workout.video_url && workout.exercises.length === 0) {
          return $scope.isEmpty = true;
        }
      });
    };
    fetchWarmup = function(id) {
      return Restangular.one('workout_templates', id).get().then(function(warmup) {
        return $scope.warmup = warmup;
      });
    };
    $scope.goToExercise = function(exercise) {
      return $state.go('app.workoutTemplateExercise', {
        workoutId: $scope.workout.id,
        exerciseId: exercise.exercise_id
      });
    };
    $scope.goToWarmupOverview = function() {
      return $state.go('app.workoutTemplateWarmups', {
        workoutId: $scope.warmup.id
      });
    };
    $scope.switchVideo = function() {
      return $scope.videoIsVisible = !$scope.videoIsVisible;
    };
    return initialize();
  }
]);
;
;
;App.controller('WorkoutsThisWeekCtrl', [
  '$scope', '$state', 'Restangular', 'storage', function($scope, $state, Restangular, storage) {
    $scope.initialize = function() {
      var params, user;
      user = storage.getCurrentUser().user_data;
      $scope.today = moment().format('YYYY-MM-DD');
      params = {
        scope: 'all_with_clients',
        range_from: moment().weekday(0).hour(0).minute(1).format('YYYY-MM-DD HH:mm:ss'),
        range_to: moment().weekday(6).hour(23).minute(59).format('YYYY-MM-DD HH:mm:ss')
      };
      return Restangular.one('users', user.id).all('collections/workout_events').getList(params).then(function(events) {
        var event, i, len;
        for (i = 0, len = events.length; i < len; i++) {
          event = events[i];
          event.date = moment(event.begins_at).format('YYYY-MM-DD');
        }
        $scope.events = events;
        return $scope.isEmpty = !events.length;
      });
    };
    $scope.isPast = function(event) {
      return event.date < $scope.today;
    };
    $scope.isFuture = function(event) {
      return event.date >= $scope.today;
    };
    return $scope.initialize();
  }
]);
;
;
;App.config([
  '$stateProvider', '$urlRouterProvider', 'RestangularProvider', '$sceDelegateProvider', '$ionicConfigProvider', function($stateProvider, $urlRouterProvider, RestangularProvider, $sceDelegateProvider, $ionicConfigProvider, authService) {
    $sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$'), new RegExp('^(http[s]?):\/\/(w{3}.)?player\.vimeo\.com\/.+$')]);
    RestangularProvider.setBaseUrl(AppConfig.backend_url);
    RestangularProvider.setDefaultHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
    $ionicConfigProvider.backButton.previousTitleText(false).text('');
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.scrolling.jsScrolling(true);
    $stateProvider.state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'features/menu/menu.html',
      controller: 'MenuCtrl'
    }).state('welcome', {
      url: '/welcome',
      "private": false,
      templateUrl: 'features/authorization/welcome/welcome.html',
      controller: 'WelcomeCtrl'
    }).state('signIn', {
      url: '/sign-in',
      "private": false,
      templateUrl: 'features/authorization/sign-in/sign-in.html',
      controller: 'SignInCtrl'
    }).state('signUp', {
      url: '/sign-up',
      "private": false,
      templateUrl: 'features/authorization/sign-up/sign-up.html',
      controller: 'SignUpCtrl'
    }).state('app.tutorial', {
      url: '/tutorial',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/tutorials/tutorials.html',
          controller: 'TutorialsCtrl'
        }
      }
    }).state('getPro', {
      url: '/get-pro',
      "private": false,
      templateUrl: 'features/search-for-pro/get-pro/get-pro.html',
      controller: 'GetProCtrl'
    }).state('invitePro', {
      url: '/invite-pro',
      "private": false,
      templateUrl: 'features/search-for-pro/invite-pro/invite-pro.html',
      controller: 'InviteProCtrl'
    }).state('proInvitationSent', {
      url: '/pro-invitation-sent',
      "private": false,
      templateUrl: 'features/search-for-pro/pro-invitation-sent/pro-invitation-sent.html'
    }).state('proRequestSent', {
      url: '/pro-request-sent',
      "private": false,
      templateUrl: 'features/search-for-pro/pro-request-sent/pro-request-sent.html'
    }).state('waitingInvitedPro', {
      url: '/waiting-invited-pro',
      "private": false,
      templateUrl: 'features/search-for-pro/waiting-invited-pro/waiting-invited-pro.html',
      controller: 'WaitingInvitedProCtrl'
    }).state('waitingGymcloudPro', {
      url: '/waiting-gymcloud-pro',
      "private": false,
      templateUrl: 'features/search-for-pro/waiting-gymcloud-pro/waiting-gymcloud-pro.html'
    }).state('forgotPassword', {
      url: '/forgot-password',
      "private": false,
      templateUrl: 'features/authorization/forgot-password/forgot-password.html',
      controller: 'ForgotPasswordCtrl'
    }).state('resetPassword', {
      url: '/reset-password',
      "private": false,
      templateUrl: 'features/authorization/reset-password/reset-password.html',
      controller: 'ResetPasswordCtrl'
    }).state('app.certUpload', {
      url: '/onboarding-cert-upload',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/certification/cert.html',
          controller: 'CertCtrl'
        }
      }
    }).state('app.certUploaded', {
      url: '/onboarding-cert-uploaded',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/certification/uploaded/cert-uploaded.html',
          controller: 'CertUploadedCtrl'
        }
      }
    }).state('app.certBlockedAccount', {
      url: '/cert-blocked-account',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/certification/cert.html',
          controller: 'CertCtrl'
        }
      }
    }).state('app.certBlockedClientsAdd', {
      url: '/cert-blocked-clients-add',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/certification/cert.html',
          controller: 'CertCtrl'
        }
      }
    }).state('app.onboardingAccount', {
      url: '/onboarding-account',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/onboarding/account/account.html',
          controller: 'OnboardingAccountCtrl'
        }
      }
    }).state('app.onboardingPrograms', {
      url: '/onboarding-programs',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/onboarding/programs/programs.html',
          controller: 'OnboardingProgramsCtrl'
        }
      }
    }).state('app.onboardingSuccess', {
      url: '/onboarding-success',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/onboarding/success/success.html',
          controller: 'OnboardingSuccessCtrl'
        }
      }
    }).state('app.trialEnded', {
      url: '/trial-ended',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/payments/trial-ended/trial-ended.html',
          controller: 'TrialEndedCtrl'
        }
      }
    }).state('app.comingSoon', {
      url: '/coming-soon',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/coming-soon/coming-soon.html'
        }
      }
    }).state('app.notifications', {
      url: '/notifications',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/notifications/notifications.html',
          controller: 'NotificationsCtrl'
        }
      }
    }).state('app.ownCalendar', {
      url: '/own-calendar/:userId/:date',
      cache: false,
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/calendar/own-calendar.html',
          controller: 'CalendarCtrl'
        }
      }
    }).state('app.clientCalendar', {
      url: '/client-calendar/:userId/:date',
      cache: false,
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/calendar/client-calendar.html',
          controller: 'CalendarCtrl'
        }
      }
    }).state('app.profileEdit', {
      url: '/profile-edit',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/user/profile-edit/profile-edit.html',
          controller: 'ProfileEditCtrl'
        }
      }
    }).state('app.personalItemsList', {
      url: '/users/:userId/:personalType',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/personal-items-list/personal-items-list.html',
          controller: 'PersonalItemsListCtrl'
        }
      }
    }).state('app.personalWorkoutNewEvent', {
      url: '/users/:userId/personal-workouts/:workoutId/events/new',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/events/personal-workout-event/personal-workout-new-event.html',
          controller: 'PersonalWorkoutNewEventCtrl'
        }
      }
    }).state('app.userNewEvent', {
      url: '/users/:userId/events/new',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/events/user-event/user-new-event.html',
          controller: 'UserNewEventCtrl'
        }
      }
    }).state('app.personalWorkoutEventResults', {
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/results',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/results/results/results.html',
          controller: 'PersonalWorkoutEventResultsCtrl'
        }
      }
    }).state('app.resultsWorkoutOverview', {
      url: '/users/:userId/personal-workouts/:workoutId/overview',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/personal/pro-workout.html',
          controller: 'ResultsWorkoutOverviewCtrl'
        }
      }
    }).state('app.resultsSummary', {
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/overview',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/results/overview/results-overview.html',
          controller: 'ResultsOverviewCtrl'
        }
      }
    }).state('app.eventCompleted', {
      url: '/users/:userId/personal-workouts/:workoutId/events/:eventId/completed',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/events/completed/event-completed.html',
          controller: 'EventCompletedCtrl'
        }
      }
    }).state('app.test', {
      url: '/test',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/to-implement/test.html',
          controller: 'TestCtrl'
        }
      }
    }).state('app.workoutsThisWeek', {
      url: '/workouts-this-week',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/workouts-this-week/workouts-this-week.html',
          controller: 'WorkoutsThisWeekCtrl'
        }
      }
    }).state('app.clientsPerfomance', {
      url: '/clients-perfomance',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients-perfomance/clients-perfomance.html',
          controller: 'ClientsPerfomanceCtrl'
        }
      }
    }).state('app.videoLibrary', {
      url: '/video-library',
      cache: false,
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/videos/library/video-library.html',
          controller: 'VideoLibraryCtrl'
        }
      }
    }).state('app.clientVideoLibrary', {
      url: '/users/:userId/video-library',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/videos/client-library/client-video-library.html',
          controller: 'ClientVideoLibraryCtrl'
        }
      }
    }).state('app.videoEdit', {
      url: '/video-library/:videoId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/videos/edit/video-edit.html',
          controller: 'VideoEditCtrl'
        }
      }
    }).state('app.conversationsList', {
      url: '/conversations-list',
      "private": true,
      cache: false,
      views: {
        menuContent: {
          templateUrl: 'features/conversations/list/conversations-list.html',
          controller: 'ConversationsListCtrl'
        }
      }
    }).state('app.newConversationRecipients', {
      url: '/new-conversation-recipients',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/conversations/recipients/new-conversation-recipients.html',
          controller: 'NewConversationRecipientsCtrl'
        }
      }
    }).state('app.newConversation', {
      url: '/new-conversation/:recipientId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/conversations/new/new-conversation.html',
          controller: 'ConversationCtrl'
        }
      }
    }).state('app.proDashboard', {
      url: '/pro-dashboard',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/dashboard/dashboard.html',
          controller: 'DashboardCtrl'
        }
      }
    }).state('app.myTraining', {
      url: '/my-training',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/user/profile/my-training.html',
          controller: 'UserProfileCtrl'
        }
      }
    }).state('app.clients', {
      url: '/clients',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/list/clients.html',
          controller: 'ClientsCtrl'
        }
      }
    }).state('app.inviteClient', {
      url: '/clients/invite',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/invite/invite-client.html',
          controller: 'InviteClientCtrl'
        }
      }
    }).state('app.createGroup', {
      url: '/clients/create-group',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/create-group/create-group.html',
          controller: 'CreateGroupCtrl'
        }
      }
    }).state('app.addParticipants', {
      url: '/clients/group/:groupId/add-participants',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/add-participants-to-group/add-participants.html',
          controller: 'AddParticipantsCtrl'
        }
      }
    }).state('app.clientGroup', {
      url: '/client-group/:groupId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/client-group/client-group.html',
          controller: 'ClientGroupCtrl'
        }
      }
    }).state('app.groupTemplatesList', {
      url: '/client-group/:groupId/:templateType',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/group-templates-list/group-templates-list.html',
          controller: 'GroupTemplatesListCtrl'
        }
      }
    }).state('app.groupClients', {
      url: '/client-group/:groupId/clients',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/clients/group-clients/group-clients.html',
          controller: 'GroupClientsCtrl'
        }
      }
    }).state('app.userProfile', {
      url: '/users/:userId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/user/profile/user-profile.html',
          controller: 'UserProfileCtrl'
        }
      }
    }).state('app.assignItem', {
      url: '/assign/:itemType/:itemId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/assign/assign.html',
          controller: 'AssignCtrl'
        }
      }
    }).state('app.exerciseTemplate', {
      url: '/exercise-templates/:exerciseId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/exercise/template/exercise-template.html',
          controller: 'ExerciseTemplateCtrl'
        }
      }
    }).state('app.workoutTemplate', {
      url: '/workout-templates/:workoutId',
      "private": true,
      edge: true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/template/workout-template.html',
          controller: 'WorkoutTemplateCtrl'
        }
      }
    }).state('app.workoutTemplateWarmups', {
      url: '/workout-template-warmups/:workoutId',
      "private": true,
      edge: true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/template/workout-template-warmups.html',
          controller: 'WorkoutTemplateCtrl'
        }
      }
    }).state('app.workoutTemplateExercise', {
      url: '/workout-templates/:workoutId/exercise/:exerciseId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html',
          controller: 'ExerciseTemplateCtrl'
        }
      }
    }).state('app.programTemplate', {
      url: '/program-templates/:programId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/program/template/program-template.html',
          controller: 'ProgramCtrl'
        }
      }
    }).state('app.programTemplateOverview', {
      url: '/program-templates/:programId/overview/:workoutId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/program/template-overview/program-template-overview.html',
          controller: 'ProgramTemplateOverviewCtrl'
        }
      }
    }).state('app.workoutExercise', {
      url: '/users/:userId/workout-exercises/:exerciseId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html',
          controller: 'WorkoutExerciseCtrl'
        }
      }
    }).state('app.personalExercise', {
      url: '/users/:userId/personal-exercises/:exerciseId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/exercise/workout-exercise/workout-exercise.html',
          controller: 'PersonalExerciseCtrl'
        }
      }
    }).state('app.personalWorkout', {
      url: '/users/:userId/personal-workouts/:workoutId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/personal/pro-workout.html',
          controller: 'PersonalWorkoutCtrl'
        }
      }
    }).state('app.personalProgram', {
      url: '/users/:userId/personal-programs/:programId/',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/program/personal/pro-program.html',
          controller: 'ProgramCtrl'
        }
      }
    }).state('app.personalProgramWorkout', {
      url: '/users/:userId/personal-programs/:programId/workouts/:workoutId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/personal/pro-workout.html',
          controller: 'PersonalWorkoutCtrl'
        }
      }
    }).state('app.templatesList', {
      url: '/:templateType/:folderId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/templates-list/templates-list.html',
          controller: 'TemplatesListCtrl'
        }
      }
    }).state('app.exerciseFolderTemplate', {
      url: '/:templateType/:folderId/exercise-templates/:exerciseId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/exercise/folder-template/exercise-template.html',
          controller: 'ExerciseTemplateCtrl'
        }
      }
    }).state('app.workoutFolderTemplate', {
      url: '/:templateType/:folderId/workout-templates/:workoutId',
      "private": true,
      edge: true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/folder-template/workout-template.html',
          controller: 'WorkoutTemplateCtrl'
        }
      }
    }).state('app.programFolderTemplate', {
      url: '/:templateType/:folderId/program-templates/:programId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/program/folder-template/program-template.html',
          controller: 'ProgramCtrl'
        }
      }
    }).state('app.newTemplate', {
      url: '/new/:templateType',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/new-template/new-template.html',
          controller: 'NewTemplateCtrl'
        }
      }
    }).state('app.proConversation', {
      url: '/conversation/:conversationId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/conversations/conversation/pro-conversation.html',
          controller: 'ConversationCtrl'
        }
      }
    }).state('app.clientDashboard', {
      url: '/client-dashboard',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/dashboard/dashboard.html',
          controller: 'DashboardCtrl'
        }
      }
    }).state('app.clientPersonalWorkout', {
      url: '/users/:userId/personal-workouts/:workoutId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/workout/personal/client-workout.html',
          controller: 'PersonalWorkoutCtrl'
        }
      }
    }).state('app.clientPersonalProgram', {
      url: '/users/:userId/personal-programs/:programId/',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/program/personal/client-program.html',
          controller: 'ProgramCtrl'
        }
      }
    }).state('app.clientConversation', {
      url: '/conversation/:conversationId',
      "private": true,
      views: {
        menuContent: {
          templateUrl: 'features/conversations/conversation/client-conversation.html',
          controller: 'ConversationCtrl'
        }
      }
    });
    return $urlRouterProvider.otherwise('/welcome');
  }
]);
;App.directive('browseTo', function($ionicGesture) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attrs) {
      var handleTap, tapGesture;
      handleTap = function(e) {
        return window.open(encodeURI($attrs.browseTo), '_system');
      };
      tapGesture = $ionicGesture.on('tap', handleTap, $element);
      return $scope.$on('$destroy', function() {
        return $ionicGesture.off(tapGesture, 'tap', handleTap);
      });
    }
  };
});
;App.directive('onlyDigits', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      return modelCtrl.$parsers.push(function(inputValue) {
        var transformedInput;
        transformedInput = inputValue.toLowerCase().replace(/[^0-9.]/g, '');
        if (transformedInput !== inputValue) {
          modelCtrl.$setViewValue(transformedInput);
          modelCtrl.$render();
        }
        return transformedInput;
      });
    }
  };
});
;App.filter('notificationCssClass', function() {
  return function(item) {
    var notifications;
    return notifications = {
      'personal_workout.create': 'event-personal-item-create',
      'personal_program.create': 'event-personal-item-create',
      'workout_event.create': 'event-workout-event-create',
      'user.invitation_accepted': 'event-user-update',
      'exercise_result.create': 'event-exercise-result-create',
      'comment.create': 'event-comment-create'
    }[item.key];
  };
});
;App.filter('notificationType', function() {
  return function(item) {
    var notifications;
    return notifications = {
      'personal_workout.create': 'has assigned new workout',
      'personal_program.create': 'has assigned new program',
      'workout_event.create': 'has scheduled new event',
      'user.invitation_accepted': 'has accepted invitation',
      'exercise_result.create': 'has entered new results',
      'comment.create': 'has added a comment'
    }[item.key];
  };
});
;App.filter('removeExtension', function() {
  return function(name) {
    var re;
    re = /\.(webm|mkv|flv|vob|mp4|m4v|avi|mpeg|mpg|3gp|mov)$/i;
    return name != null ? name.replace(re, '') : void 0;
  };
});
;App.factory('$exceptionHandler', function() {
  return function(exception, cause) {
    console.error(exception);
    return alert(exception);
  };
});
;App.factory('convertPropertiesService', function() {
  var onGet, onGetResult, onSet, round;
  round = function(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };
  onGet = function(name, property) {
    var saveUnit, unit, value;
    if (!property[name] || !property.value || _.includes([0, 1], property.personal_property.property_units.length) || !property.property_unit_id) {
      return round(property[name], 0) || null;
    }
    saveUnit = property.personal_property.save_unit.short_name;
    unit = math.unit(property[name] + " " + saveUnit);
    value = unit.toNumber(property.property_unit_name);
    return round(value, 0);
  };
  onGetResult = function(name, item) {
    var saveUnit, unit, value;
    if (!item[name] || _.includes([0, 1], item.exercise_property.personal_property.property_units.length) || !item.exercise_property.property_unit_id) {
      return round(item[name], 0);
    }
    saveUnit = item.exercise_property.personal_property.save_unit.short_name;
    unit = math.unit(item[name] + " " + saveUnit);
    value = unit.toNumber(item.exercise_property.property_unit_name);
    return round(value, 0);
  };
  onSet = function(name, value, property) {
    var newValue, saveUnit, unit;
    if (!value || _.includes([0, 1], property.personal_property.property_units.length) || !property.property_unit_id) {
      return property[name] = round(value, 2) || null;
    }
    saveUnit = property.personal_property.save_unit.short_name;
    unit = math.unit(value + " " + property.property_unit_name);
    newValue = unit.toNumber(saveUnit);
    return property.new_result = round(newValue, 2) || null;
  };
  return {
    get: function(workout) {
      var exercise, i, item, j, k, l, len, len1, len2, len3, properties, property, ref, ref1, ref2, result, results;
      ref = workout.exercises;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        exercise = ref[i];
        properties = exercise.exercise_properties || [];
        for (j = 0, len1 = properties.length; j < len1; j++) {
          property = properties[j];
          property.value = onGet('value', property);
          if (property.value2) {
            property.value2 = onGet('value2', property);
          }
        }
        if (exercise.exercise_results.length > 0) {
          ref1 = exercise.exercise_results;
          for (k = 0, len2 = ref1.length; k < len2; k++) {
            result = ref1[k];
            ref2 = result.exercise_result_items;
            for (l = 0, len3 = ref2.length; l < len3; l++) {
              item = ref2[l];
              item.value = onGetResult('value', item);
            }
          }
        }
        if (exercise.previous) {
          results.push((function() {
            var len4, m, ref3, results1;
            ref3 = exercise.previous.exercise_results;
            results1 = [];
            for (m = 0, len4 = ref3.length; m < len4; m++) {
              result = ref3[m];
              results1.push((function() {
                var len5, n, ref4, results2;
                ref4 = result.exercise_result_items;
                results2 = [];
                for (n = 0, len5 = ref4.length; n < len5; n++) {
                  item = ref4[n];
                  results2.push(item.value = onGetResult('value', item));
                }
                return results2;
              })());
            }
            return results1;
          })());
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    getOneResult: function(resultItem) {
      return resultItem.value = onGetResult('value', resultItem);
    },
    set: function(exercise) {
      var i, len, property, ref, results;
      ref = exercise.exercise_properties;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        property = ref[i];
        results.push(onSet(property.personal_property.name, property.new_result, property));
      }
      return results;
    }
  };
});
;App.factory('errorsService', [
  '$ionicPopup', function($ionicPopup) {
    return {
      errorAlert: function(error, description) {
        return $ionicPopup.alert({
          title: error,
          template: description
        });
      }
    };
  }
]);
;App.factory('ewpService', [
  'Restangular', 'storage', function(Restangular, storage) {
    return {
      getExercises: function(user_id) {
        return Restangular.one('users', user_id).one('collections/workout_exercises').getList();
      },
      getWorkoutTemplates: function(user_id) {
        return Restangular.one('users', user_id).one('collections/workout_templates').getList();
      },
      getProgramTemplates: function(user_id) {
        return Restangular.one('users', user_id).one('collections/program_templates').getList();
      },
      getPersonalExercises: function(user_id) {
        return Restangular.one('users', user_id).one('collections/personal_exercises').getList();
      },
      getPersonalWarmups: function(user_id) {
        return Restangular.one('users', user_id).one('collections/personal_warmups').getList();
      },
      getPersonalWorkouts: function(user_id) {
        return Restangular.one('users', user_id).one('collections/personal_workouts').getList();
      },
      getPersonalPrograms: function(user_id) {
        return Restangular.one('users', user_id).one('collections/personal_programs').getList();
      },
      getGroupWorkouts: function(group_id) {
        return Restangular.one('client_groups', group_id).one('assignments/workout_templates').getList();
      },
      getGroupPrograms: function(group_id) {
        return Restangular.one('client_groups', group_id).one('assignments/program_templates').getList();
      },
      getGroupClients: function(group_id) {
        return Restangular.one('client_groups', group_id).one('members').getList();
      }
    };
  }
]);
;App.factory('queryParamsParserService', [
  function() {
    return {
      queryString: function(url) {
        var arr, i, pair, query, query_string, vars;
        query_string = {};
        query = _.last(url.split('?'));
        vars = query.split('&');
        i = 0;
        while (i < vars.length) {
          pair = vars[i].split('=');
          if (typeof query_string[pair[0]] === 'undefined') {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
          } else if (typeof query_string[pair[0]] === 'string') {
            arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr;
          } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
          }
          i++;
        }
        return query_string;
      }
    };
  }
]);
;App.factory('sharedData', function() {
  var newEventDate;
  newEventDate = null;
  return {
    setEventDate: function(date) {
      return newEventDate = date;
    },
    getEventDate: function() {
      var dateToReturn;
      dateToReturn = newEventDate;
      newEventDate = null;
      return dateToReturn;
    }
  };
});
;App.factory('urlInterceptionService', [
  '$rootScope', '$state', 'Restangular', 'queryParamsParserService', 'sharedData', 'storage', 'notificationsService', function($rootScope, $state, Restangular, queryParamsParserService, sharedData, storage, notificationsService) {
    return {
      redirect: function(url) {
        var date, id, isComments, numberRegex, route, stateRegex;
        stateRegex = /#[a-z_]+/i;
        numberRegex = /[0-9-]+/;
        route = stateRegex.exec(url);
        if (!route) {
          return false;
        }
        switch (route[0]) {
          case '#signup':
            $rootScope.invitationParams = queryParamsParserService.queryString(url);
            return $state.go('signUp');
          case '#reset':
            $rootScope.resetPasswordToken = _.last(url.split('/'));
            return $state.go('resetPassword');
          case '#calendar':
            date = numberRegex.exec(url);
            date = moment(date[0]).format();
            return $state.go('app.ownCalendar', {
              userId: storage.getCurrentUser().user_data.id,
              date: date
            }, {
              reload: true
            });
          case '#personal_workouts':
            id = numberRegex.exec(url);
            return Restangular.one('personal_workouts', id).get().then(function(workout) {
              return $state.go('app.personalWorkout', {
                userId: workout.person_id,
                workoutId: workout.id
              });
            });
          case '#personal_programs':
            id = numberRegex.exec(url);
            return Restangular.one('personal_programs', id).get().then(function(program) {
              return $state.go('app.personalProgram', {
                userId: program.person_id,
                programId: program.id
              });
            });
          case '#events':
            isComments = _.last(url.split('/')) === 'comments';
            if (isComments) {
              notificationsService.setCommentState();
            }
            id = numberRegex.exec(url);
            return Restangular.one('workout_events', id).get().then(function(event) {
              return $state.go('app.personalWorkoutEventResults', {
                userId: event.person_id,
                workoutId: event.personal_workout_id,
                eventId: event.id
              });
            });
          default:
            return false;
        }
      },
      redirectWeb: function() {
        var match, regex;
        regex = /[a-z]+/i;
        match = regex.exec(window.location.hash);
        if (!match) {
          return false;
        }
        switch (match[0]) {
          case 'signup':
            return $rootScope.invitationParams = queryParamsParserService.queryString(window.location.hash);
        }
      }
    };
  }
]);
;
//# sourceMappingURL=app.js.map