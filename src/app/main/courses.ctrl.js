(function() {
    'use strict';

    angular
        .module('flavido')
        .controller('CoursesController', CoursesController);

    /** @ngInject */
    function CoursesController(CommonInfo, $http, $state, _, $log, moment) {
        var vm = this;

        vm.allCourses = [];
        vm.allInstructors = [];
        vm.stars = [1,2,3,4,5];
        vm.courseSearchCriteria = {
            status: 1,
            isForsale: 1,
            name: '',
            categoryId: '',
            instructorId: ''
        };
        //vm.selectedInstructor = 'All Instructors';
        vm.listLimit = 3;

        vm.getAllCourses = getAllCourses;
        vm.searchCoursesByInstructor = searchCoursesByInstructor;
        vm.searchCoursesByCategory = searchCoursesByCategory;
        vm.searchCoursesByText = searchCoursesByText;

        vm.showCourseDetails = showCourseDetails;
        vm.showAllCourses = showAllCourses;
        vm.showInstructorCourses = showInstructorCourses;

        activate();

        function activate() {
            vm.user = CommonInfo.getInfo('studentInfo');
            getAllCategories();
            getAllInstructors();
            getAllCourses();
            getUpcommingCourses();
        }

        function getAllInstructors() {
            $http.post(CommonInfo.getAppUrl() + "/getallusers", { type: 3 }).then(
                function(response) {
                    if (response && response.data) {
                        if (response.data.status == 1) {
                            vm.allInstructors = response.data.data;
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

        function searchCoursesByInstructor(instructor) {
            if (instructor) {
                vm.courseSearchCriteria.instructorId = instructor.id;
                //vm.selectedInstructor = instructor.fullName;
                $state.go('courses.search', { param: 'instructor', value: instructor.id, name: instructor.fullName.replace(/ /g, "_") });
            } else {
                vm.courseSearchCriteria.instructorId = '';
                //vm.selectedInstructor = 'All Instructors';
                $state.go('courses.list');
            }
            //getAllCourses();
        }

        function searchCoursesByCategory(category) {
            vm.courseSearchCriteria.categoryId = category.id;
            $state.go('courses.search', { param: 'category', value: category.id, name: category.name.replace(/ /g, "_") });
            //getAllCourses();
        }

        function searchCoursesByText() {
            vm.courseSearchCriteria.name = vm.searchText;
            $state.go('courses.search', { param: 'search', value: vm.searchText, name: '' });
            //getAllCourses();
        }

        function getAllCourses() {
            // var param = $stateParams.param;
            // var value = $stateParams.value;
            // if (param && value) {
            //     vm.courseSearchCriteria[param] = value;
            // } else {
            //     $state.go('courses.list');
            // }
            $http.post(CommonInfo.getAppUrl() + "/searchcourses", vm.courseSearchCriteria).then(
                function(response) {
                    if (response && response.data) {
                        if (response.data.status == 1) {
                            vm.allCourses = response.data.data;
                            _.forEach(vm.allCourses, function(value) {
                                value.courseStartDate = moment(value.courseStartDate).format("MMM DD, YYYY");
                                value.courseEndDate = moment(value.courseEndDate).format("MMM DD, YYYY");
                            });
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

        function getUpcommingCourses() {
            $http.get(CommonInfo.getAppUrl() + "/upcomingcourses").then(
                function(response) {
                    if (response && response.data) {
                        if (response.data.status == 1) {
                            vm.allUpcommingCourses = response.data.data;
                            _.forEach(vm.allUpcommingCourses, function(value) {
                                value.courseStartDate = moment(value.courseStartDate).format("YYYY-MM-DD hh:mm");
                                value.courseEndDate = moment(value.courseEndDate).format("YYYY-MM-DD hh:mm");
                            });
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

        function getAllCategories() {
            $http.get(CommonInfo.getAppUrl() + "/getactivecoursecats").then(
                function(response) {
                    if (response && response.data) {
                        if (response.data.status == 1) {
                            vm.categories = response.data.data;
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

        function showCourseDetails(course) {
            if (course) {
                CommonInfo.setInfo('selectedCourseId', course.id);
                CommonInfo.setInfo('courseSearchCriteria', vm.courseSearchCriteria);
                $state.go('courseDetails', { name: course.title.replace(/ /g, "_") });
            }
        }

        function showAllCourses() {
            $state.go('courses.search', { query: '123' });
        }

        function showInstructorCourses(course) {
            if (course.instructorId) {
                $state.go('instructorCourses', { name: course.instructorFullName.replace(/ /g, "_") })
            }
        }
    }
})();
