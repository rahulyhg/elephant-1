(function() {
  'use strict';

  angular
    .module('flavido')
    .controller('StudentProfileController', StudentProfileController);

  /** @ngInject */
  function StudentProfileController(CommonInfo, $http, growl, Upload, SweetAlert) {
    var vm = this;

    vm.profileTab = 1;
    vm.addEditAddess = false;
    vm.studentInfo = {};
    vm.newProfile = {
      userName: '',
      image: '',
      userBio: '',
      updateId: ''
    };
    vm.contact = {
      email: '',
      mobile: '',
      showVerify: 0
    };
    vm.password = {
      current_password: '',
      new_password: '',
      confirm: ''
    };

    vm.notification = {
      promotional: 0,
      upcoming: 0
    };

    vm.preference = {
      mains: 0,
      prelims: 0,
      interview: 0,
      gs: 0,
      optional: 0,
      ssc: 0,
      ies: 0
    };

    vm.updateProfile = updateProfile;
    vm.updatePassword = updatePassword;
    vm.changeEmail = changeEmail
    vm.changeEmailVerification = changeEmailVerification;
    vm.changeMobile = changeMobile;
    vm.changeMobileVerification = changeMobileVerification;
    vm.updateNotification = updateNotification;
    vm.updatePreference = updatePreference;
    vm.updateAddress = updateAddress;
    vm.editAddress = editAddress;

    activate();

    function activate() {
      vm.studentInfo = CommonInfo.getInfo('studentInfo');
      if (!vm.studentInfo || !vm.studentInfo.userId) {
        $state.go('main');
      }
      if (vm.studentInfo) {
        vm.newProfile.userName = vm.studentInfo.name;
        vm.newProfile.image = vm.studentInfo.profile_picture;
        vm.newProfile.userBio = vm.studentInfo.biography;
        vm.newProfile.updateId = vm.studentInfo.userId;
        vm.contact.email = vm.studentInfo.email;
        vm.contact.mobile = parseInt(vm.studentInfo.mobile);
        vm.password.update_id = vm.studentInfo.userId
      }
      getNotificationSetting();
      getPreferenceSetting();
      getStudentAddress();
    }

    function updateProfile(file) {
      if (!file || angular.isString(file)) {
        uploadProfile();
      } else {
        Upload.base64DataUrl(file).then(function(url) {
          vm.newProfile.image = url;
          uploadProfile();
        });
      }
    }

    function uploadProfile() {
      if (vm.newProfile && vm.newProfile.updateId && vm.newProfile.userName) {
        $http.post(CommonInfo.getAppUrl() + "/updatestudentprofile", vm.newProfile).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                vm.studentInfo.profile_picture = vm.newProfile.image;
                vm.studentInfo.name = vm.newProfile.userName;
                vm.studentInfo.biography = vm.newProfile.userBio;
                CommonInfo.setInfo('studentInfo', vm.studentInfo);
                activate();
                growl.success('Profile updated successfuly');
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function updatePassword() {
      if (vm.password) {
        if (vm.password.current_password && vm.password.new_password && vm.password.current_password != vm.password.new_password) {
          if (vm.password.confirm && vm.password.new_password == vm.password.confirm) {
            SweetAlert.swal({
                title: "Are you sure?",
                input: 'text',
                text: "This will change your password forever!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                closeOnConfirm: false
              },
              function(isConfirm) {
                if (isConfirm) {
                  $http.post(CommonInfo.getAppUrl() + "/updatestudentpassword", vm.password).then(
                    function(response) {
                      if (response && response.data) {
                        if (response.data.status == 1) {
                          SweetAlert.swal("Password Change!", "Your password has been changed.", "success");
                          vm.password = {
                            current_password: '',
                            new_password: '',
                            confirm: ''
                          };
                        } else if (response.data.status == 2) {
                          growl.info(response.data.message);
                        } else if (response.data.status == 3) {
                          growl.warning(response.data.message);
                        }
                      } else {
                        growl.warning('There is some issue, please try after some time');
                      }
                    },
                    function(response) {
                      growl.warning('There is some issue, please try after some time');
                    }
                  );
                } else {
                  SweetAlert.swal("Cancelled", "Your imaginary file is safe :)", "error");
                }
              });
            // $http.post(CommonInfo.getAppUrl() + "/updatestudentpassword", vm.password).then(
            //     function(response) {
            //         if (response && response.data) {
            //             if (response.data.status == 1) {
            //               growl.success('Password updated successfuly');
            //             } else if (response.data.status == 2) {
            //                 growl.info(response.data.message);
            //             } else if (response.data.status == 3) {
            //                 growl.warning(response.data.message);
            //             }
            //         } else {
            //             growl.warning('There is some issue, please try after some time');
            //         }
            //     },
            //     function(response) {
            //         growl.warning('There is some issue, please try after some time');
            //     }
            // );
          } else {
            growl.info('New password does not match with confirm password');
          }
        } else {
          growl.info('You have entered same password');
        }
      }
    }

    function changeEmail() {
      if (vm.contact.email && vm.contact.email != vm.studentInfo.email) {
        var data = {
          student_id: vm.studentInfo.userId,
          new_email: vm.contact.email,
          old_email: vm.studentInfo.email
        };
        $http.post(CommonInfo.getAppUrl() + "/updatestudentemailafterlogin", data).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                SweetAlert.swal("Email Change!", "A code for verification has been send to new email id. Please enter code for complete change process", "success");
                vm.contact.showVerify = 2;
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              } else if (response.data.status == 3) {
                growl.warning(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function changeEmailVerification() {
      if (vm.contact.emailVerify) {
        var data = {
          token: vm.contact.emailVerify,
          new_email: vm.contact.email,
          casetype: vm.studentInfo.userId
        };
        $http.post(CommonInfo.getAppUrl() + "/verifystudentemailcode", data).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                vm.contact.showVerify = 0;
                vm.contact.emailVerify = '';
                vm.studentInfo.email = vm.contact.email;
                CommonInfo.setInfo('studentInfo', vm.studentInfo);
                activate();
                growl.success('Email updated successfuly');
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function changeMobile() {
      if (vm.contact.mobile && vm.contact.mobile != vm.studentInfo.mobile) {
        var data = {
          student_id: vm.studentInfo.userId,
          old_phone: vm.studentInfo.mobile,
          new_phone: vm.contact.mobile,
          email: vm.studentInfo.email
        };
        $http.post(CommonInfo.getAppUrl() + "/updatestudentphoneafterlogin", data).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                SweetAlert.swal("Mobile Change!", "A code for verification has been send to your new mobile number. Please enter code for complete change process", "success");
                vm.contact.showVerify = 1;
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              } else if (response.data.status == 3) {
                growl.warning(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function changeMobileVerification() {
      if (vm.contact.phoneVerify) {
        var data = {
          OTP: vm.contact.phoneVerify,
          old_phone: vm.studentInfo.mobile,
          phone: vm.contact.mobile,
          student_id: vm.studentInfo.userId
        };
        $http.post(CommonInfo.getAppUrl() + "/verifyotpchangephone", data).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                growl.success('Mobile updated successfuly');
                vm.contact.showVerify = 0;
                vm.contact.phoneVerify = '';
                vm.studentInfo.mobile = vm.contact.mobile;
                CommonInfo.setInfo('studentInfo', vm.studentInfo);
                activate();
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function getNotificationSetting() {
      $http.post(CommonInfo.getAppUrl() + "/getNotifybyStudid", { studentId: vm.studentInfo.userId }).then(
        function(response) {
          if (response && response.data) {
            if (response.data.status == 1) {
              if (response.data.data)
                vm.notification = _.merge(vm.notification, response.data.data);
            } else if (response.data.status == 2) {
              growl.info(response.data.message);
            }
          } else {
            growl.warning('There is some issue, please try after some time');
          }
        },
        function(response) {
          growl.warning('There is some issue, please try after some time');
        }
      );
    }

    function updateNotification() {
      if (vm.notification) {
        vm.notification.studentId = vm.studentInfo.userId;
        $http.post(CommonInfo.getAppUrl() + "/cuNotificationSetting", vm.notification).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                growl.success('Notification setting updated successfuly');
                //vm.notification = {};
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function getPreferenceSetting() {
      $http.post(CommonInfo.getAppUrl() + "/getPreferencebyStudid", { studentId: vm.studentInfo.userId }).then(
        function(response) {
          if (response && response.data) {
            if (response.data.status == 1) {
              if (response.data.data)
                vm.preference = _.merge(vm.preference, response.data.data);
            } else if (response.data.status == 2) {
              growl.info(response.data.message);
            }
          } else {
            growl.warning('There is some issue, please try after some time');
          }
        },
        function(response) {
          growl.warning('There is some issue, please try after some time');
        }
      );
    }

    function updatePreference() {
      if (vm.preference) {
        vm.preference.studentId = vm.studentInfo.userId;
        $http.post(CommonInfo.getAppUrl() + "/cuPreferenceSetting", vm.preference).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                growl.success('Preference setting updated successfuly');
                //vm.notification = {};
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }

    function getStudentAddress() {
      $http.post(CommonInfo.getAppUrl() + "/getAddressByStudentId", { studentId: vm.studentInfo.userId }).then(
        function(response) {
          if (response && response.data) {
            if (response.data.status == 1) {
              if (response.data.data)
                vm.studentAddress = response.data.data;
            } else if (response.data.status == 2) {
              growl.info(response.data.message);
            }
          } else {
            growl.warning('There is some issue, please try after some time');
          }
        },
        function(response) {
          growl.warning('There is some issue, please try after some time');
        }
      );
    }

    function editAddress(address) {
      vm.address = angular.copy(address);
      vm.addEditAddess = true;
    }

    function updateAddress() {
      if (vm.address) {
        vm.address.studentId = vm.studentInfo.userId;
        $http.post(CommonInfo.getAppUrl() + "/createUpdateAddress", vm.address).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                growl.success('Address updated successfuly');
                vm.address = {};
                vm.addEditAddess = false;
                getStudentAddress();
              } else if (response.data.status == 2) {
                growl.info(response.data.message);
              }
            } else {
              growl.warning('There is some issue, please try after some time');
            }
          },
          function(response) {
            growl.warning('There is some issue, please try after some time');
          }
        );
      }
    }
  }
})();
