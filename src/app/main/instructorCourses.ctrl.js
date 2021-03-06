(function() {
  'use strict';

  angular
    .module('flavido')
    .controller('InstructorCoursesController', InstructorCoursesController);

  /** @ngInject */
  function InstructorCoursesController(CommonInfo, $log, $http, $mdDialog, $stateParams, $scope, $state, $anchorScroll, growl, _, moment, ngMeta) {
    var vm = this;
    var selectedInstructorId;

    vm.selectedInstructorName;
    vm.stars = [1, 2, 3, 4, 5];

    vm.loginStage = 1;
    vm.student = {
      student_id: '',
      emailorphone: '',
      password: '',
      phone: ''
    };
    vm.verification = {
      OTP: '',
      student_id: '',
      phone: ''
    };

    vm.login = login;
    vm.otpVerification = otpVerification;
    vm.sendOTP = sendOTP;

    vm.showCourseDetails = showCourseDetails;
    vm.followInstructor = followInstructor;

    activate();

    function activate() {
      vm.selectedInstructorName = $stateParams.name.replace(/_/g, " ");
      $anchorScroll();
      getCourses();
    }

    function getCourses() {
      $http.post(CommonInfo.getAppUrl() + "/getInstructorCourses", { name: vm.selectedInstructorName, isForsale: 1 }).then(
        function(response) {
          if (response && response.data) {
            if (response.data.status == 1) {
              vm.instructorDetails = response.data.data;
              vm.instructorDetails.isFollowed = false;
              vm.instructorDetails.Testmonials = [];
              selectedInstructorId = vm.instructorDetails.id;
              if (vm.instructorDetails && vm.instructorDetails.courses) {
                _.forEach(vm.instructorDetails.courses, function(value) {
                  value.courseStartDate = moment(value.courseStartDate).format("YYYY-MM-DD hh:mm");
                  value.courseEndDate = moment(value.courseEndDate).format("YYYY-MM-DD hh:mm");
                });
              }
              if (vm.instructorDetails && vm.instructorDetails.followers) {
                var studentInfo = CommonInfo.getInfo('studentInfo');
                if (studentInfo && studentInfo.userId) {
                  vm.instructorDetails.isFollowed = _.filter(vm.instructorDetails.followers, { 'id': studentInfo.userId }).length ? true : false;
                }
              }
              if (vm.instructorDetails.seo && vm.instructorDetails.seo.length > 0) {
                _.forEach(vm.instructorDetails.seo, function (value){
                  if(value.tag == "title")
                    ngMeta.setTitle(value.value, '');
                  else
                    ngMeta.setTag(value.tag, value.value);  
                });
              }
              getInstructorTestimonials();

            } else if (response.data.status == 2) {
              $log.log(response.data.message);
            }
          } else {
            $log.log('There is some issue, please try after some time');
          }
        },
        function(response) {
          $log.log('There is some issue, please try after some time');
        }
      );
    }

    function getInstructorTestimonials() {
      var data = {
        instructorId: selectedInstructorId,
        status: 1
      };
      $http.post(CommonInfo.getAppUrl() + "/getactivetestimonials", data).then(
        function(response) {
          if (response && response.data) {
            if (response.data.status == 1) {
              vm.instructorDetails.Testmonials = response.data.data;
            } else if (response.data.status == 2) {
              $log.log(response.data.message);
            }
          } else {
            $log.log('There is some issue, please try after some time');
          }
        },
        function(response) {
          $log.log('There is some issue, please try after some time');
        }
      );
    }

    function followInstructor(evt) {
      var studentInfo = CommonInfo.getInfo('studentInfo');
      if (!studentInfo || !studentInfo.userId) {
        $mdDialog.show({
            targetEvent: evt,
            scope: $scope.$new(),
            templateUrl: 'app/main/login.tmpl.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true
          })
          .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
          }, function() {
            $scope.status = 'You cancelled the dialog.';
          });
      } else {
        $http.post(CommonInfo.getAppUrl() + "/followinstructor", { instructorId: selectedInstructorId, studentId: studentInfo.userId }).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                vm.instructorDetails.isFollowed = response.data.data;
                growl.success(response.data.message);
              } else if (response.data.status == 2) {
                $log.log(response.data.message);
              }
            } else {
              $log.log('There is some issue, please try after some time');
            }
          },
          function(response) {
            $log.log('There is some issue, please try after some time');
          }
        );
      }
    }

    function showCourseDetails(course) {
      if (course) {
        CommonInfo.setInfo('selectedCourseId', course.id);
        $state.go('courseDetails', { name: course.title.replace(/ /g, "_") });
      }
    }

    function login() {
      if (vm.student.emailorphone && vm.student.password) {
        vm.student.fromSource = "flavido";
        $http.post(CommonInfo.getAppUrl() + "/studentlogin", vm.student).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                $mdDialog.hide();
                //growl.success('Login Successfuly');
                CommonInfo.setInfo('studentInfo', response.data.data);
                $state.reload();
                followInstructor();
              } else if (response.data.status == 3) {
                //CommonInfo.setInfo('studentInfo', response.data.data);
                vm.verification.student_id = response.data.data.userId;
                vm.student.student_id = response.data.data.userId;
                if (response.data.message == '2') {
                  vm.loginStage = 2;
                }
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

    function otpVerification() {
      if (vm.verification && vm.verification.OTP && vm.verification.student_id && vm.verification.phone) {
        $http.post(CommonInfo.getAppUrl() + "/verifyotp", vm.verification).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                CommonInfo.setInfo('studentInfo', response.data.data);
                $state.reload();
                followInstructor();
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

    function sendOTP() {
      if (vm.verification && vm.verification.phone && vm.verification.student_id) {
        $http.post(CommonInfo.getAppUrl() + "/verifymobileandsendotp", vm.verification).then(
          function(response) {
            if (response && response.data) {
              if (response.data.status == 1) {
                growl.success('OTP send');
                vm.showOtpField = true;
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
