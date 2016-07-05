/**
 * Created by Domingo Polican on 11/16/13.
 */
/** IE hack for Array.indexOf **/
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/)   {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
      ? Math.ceil(from)
      : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)     {
      if (from in this &&
        this[from] === elt)
        return from;
    }
    return -1;
  };
}

var lunchroom = angular.module('lunchroom', ['ngResource']);
lunchroom.config(['$locationProvider',
  function($locationProvider) {
    $locationProvider.html5Mode(true);
  }]);

lunchroom.factory('Classroom', ['$resource', function($resource) {
  return $resource('./classroom/:classroomId',
    {classroomId: '@id'}, { saveAll: { method:'POST', isArray: true } });
}]);
lunchroom.factory('Menu', ['$resource', function($resource) {
  return $resource('./menu', {}, { saveAll: { method:'POST', isArray: true } });
}]);
lunchroom.factory('Order', ['$resource', function($resource) {
  return $resource('./order');
}]);

lunchroom.controller("LunchroomController", LunchroomController);
lunchroom.controller("ClassroomController", ClassroomController);
lunchroom.controller("MenuController", MenuController);
lunchroom.controller("MenuItemController", MenuItemController);
lunchroom.controller("OrdersController", OrdersController);

var LunchroomConstants = {
  grades: [
    { initials: "K", sort: 0, code: "Kin", description: "Kindergarten" },
    { initials: "1", sort: 1, code: "1st", description: "First Grade" },
    { initials: "2", sort: 2, code: "2nd", description: "Second Grade" },
    { initials: "3", sort: 3, code: "3rd", description: "Third Grade" },
    { initials: "4", sort: 4, code: "4th", description: "Fourth Grade" },
    { initials: "5", sort: 5, code: "5th", description: "Fifth Grade" },
    { initials: "6", sort: 6, code: "6th", description: "Sixth Grade" },
    { initials: "7", sort: 7, code: "7th", description: "Seventh Grade" },
    { initials: "8", sort: 8, code: "8th", description: "Eighth Grade" },
    { initials: "F", sort: 9, code: "9th", description: "Freshman" },
    { initials: "S", sort: 10, code: "10th", description: "Sophomore" },
    { initials: "J", sort: 11, code: "11th", description: "Junior" },
    { initials: "S", sort: 12, code: "12th", description: "Senior" }],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  weeklyFrequency: {code: "WEEKLY", description: "Every Week"},
  oddWeekFrequency: {code: "ODD_WEEKS", description: "Odd Weeks of the Month"},
  evenWeekFrequency: {code: "EVEN_WEEKS", description: "Even Weeks of the Month"},
};

LunchroomConstants.menuItemFrequency = [LunchroomConstants.weeklyFrequency, LunchroomConstants.oddWeekFrequency, LunchroomConstants.evenWeekFrequency];


var LunchroomFunctions = {
  getMenuItemCode: function(name) {
    var code = '';
    var leftBracketIndex = name.indexOf('[');
    var rightBracketIndex = name.indexOf(']');
    if (leftBracketIndex > -1) {
      if (rightBracketIndex < leftBracketIndex) {
        code = name.substr(leftBracketIndex + 1);
      } else {
        code = name.substring(leftBracketIndex + 1, rightBracketIndex);
      }
    } else {
      var words = name.split(' ');
      angular.forEach(words, function(word) {
        if (word.length > 2) {
          code += word.substr(0, 1).toUpperCase();
        }
      }, code);
    }
    return code;
  },

  getMenuItemDisplayName: function(name) {
    var leftBracketIndex = name.indexOf('[');
    if (leftBracketIndex > -1) {
      return name.substr(0, leftBracketIndex);
    }
    return name;
  },

  isTodayOddWeek: function() {
    var today = new Date();
    var dayOfMonth = today.getDate();
    console.log("Day of month: " + dayOfMonth);
    var weekOfMonth = Math.trunc(dayOfMonth / 7) + 1;
    console.log("Week of month: " + weekOfMonth);
    return weekOfMonth % 2;
  }

}

function LunchroomController($scope, Classroom) {
  $scope.classrooms = [ { id: 1, grade: "Kin", teacher: "Mrs. Smith" }];
  $scope.newClassroom = { students: [] };
  $scope.grades = LunchroomConstants.grades;
  $scope.editMode = false;
  $scope.loading = "Please wait...";

  $scope.init = function() {
    $scope.loading = "Please wait while loading...";
    $scope.classrooms = Classroom.query(function() { $scope.loading = null; });
  };

  $scope.sortValue = function(classroom) {
    var result = 0;
    angular.forEach($scope.grades, function(grade) {
      if (grade.code == classroom.grade) {
        result = grade.sort;
      }
    }, result);
    return result;
  };

  $scope.addClassroom = function() {
    var id = 0;
    angular.forEach($scope.classrooms, function(classroom) {
      if (!id || id < classroom.id) {
        id = classroom.id;
      }
    }, id);
    $scope.newClassroom.id = id + 1;

    $scope.loading = "Please wait while saving...";
    Classroom.save($scope.newClassroom, function(u, responseHeaders) { $scope.loading = null; }, function(response) { $scope.loading = null; $scope.error = "Error saving the newly added classroom." });
    $scope.classrooms.push($scope.newClassroom);
    $scope.newClassroom = { students: [] };
  };

  $scope.deleteClassroom = function(classroom) {
    $scope.classrooms.splice($scope.classrooms.indexOf(classroom), 1);
  };

  $scope.setEditMode = function() {
    $scope.editMode = true;
  };

  $scope.unsetEditMode = function() {
    $scope.editMode = false;

    $scope.loading = "Please wait while saving...";
    Classroom.saveAll({}, $scope.classrooms, function(u, responseHeaders) { $scope.loading = null; }, function(httpResponse) { $scope.loading = null; $scope.error = "Error saving changes."});
  }
}

function ClassroomController($scope, $location, $window, $log, Classroom, Menu) {
  $scope.classroom = { grade: "Kin", teacher: "Mrs Smith", students: [ { name: "John McKinney", order:{} }] };
  $scope.menu = [ { code: 'HD', name: 'Hot Dog', misc: true, price: 1.5 }, { code: 'P', name: 'Pizza Slice', misc: false, price: 1.25 }];
  $scope.editMode = false;
  $scope.newStudent = { order: {} };

  var menuItemHasNoGradeDesignation = function(item) {
    var hasGradeDesignation = false;
    angular.forEach(LunchroomConstants.grades, function(grade) {
      if (item[grade.code]) {
        hasGradeDesignation = true;
      }
    });

    return !hasGradeDesignation;
  }

  var menuItemMatchesWeek = function(item) {
    if (item.frequency.code === LunchroomConstants.weeklyFrequency.code) {
      console.log("Every week.");
      return true;

    }
    if ($scope.oddWeek) {
      if (item.frequency.code === LunchroomConstants.oddWeekFrequency.code) {
        console.log("Odd week.");
        return true;
      }
    } else {
      if (item.frequency.code === LunchroomConstants.evenWeekFrequency.code) {
        console.log("Even week.");
        return true;
      }
    }

    console.log("No match.");
    return false;
  }

  $scope.init = function() {
    var id = $location.search().id;
    if (id) {
      $scope.oddWeek = LunchroomFunctions.isTodayOddWeek();
      $scope.classroom = Classroom.get({ 'classroomId': id }, function() {
        if (!$scope.classroom.students) {
          $scope.classroom.students = [];
        }

        var gradeCode = null;
        angular.forEach(LunchroomConstants.grades, function(grade) {
          if (grade.code == $scope.classroom.grade) {
            gradeCode = grade.code;
          }
        });

        var menu = Menu.query(function() {
          var today = LunchroomConstants.days[new Date().getDay()];
          var todaysMenu = [];

          angular.forEach(menu, function(menuItem) {
            if ((menuItem.day == today || menuItem.misc)
                && (menuItemHasNoGradeDesignation(menuItem) || menuItem[gradeCode])
                && menuItemMatchesWeek(menuItem)) {
              todaysMenu.push(menuItem);
            }
          });

          $scope.menu = todaysMenu;
        });
      });
    }
  };

  $scope.setEditMode = function() {
    $scope.editMode = true;

  };

  $scope.unsetEditMode = function() {
    $scope.editMode = false;
  };

  $scope.deleteStudent = function(student) {
    $scope.classroom.students.splice($scope.classroom.students.indexOf(student), 1);
  };

  $scope.addStudent = function() {
    if ($scope.newStudent.name) {
      // TODO: Verify student name is unique
      $scope.classroom.students.push($scope.newStudent);
      $scope.newStudent = { order: {} };
    }
  };

  $scope.addOrder = function($event, order, item) {
    if (order[item]) {
      order[item] = order[item] + ($event.altKey ? -1 : 1);
    } else {
      order[item] = ($event.altKey ? 0 : 1);
    }
  };

  $scope.getDisplayName = function(itemName) {
      return LunchroomFunctions.getMenuItemDisplayName(itemName);
  };

  $scope.getItemTotal = function(item) {
    var total = 0;
    angular.forEach($scope.classroom.students, function(student) {
      if (student.order[item]) {
        total += student.order[item];
      }
    }, total);

    return total;
  };

  $scope.getStudentOrderCount = function() {
    var total = 0;
    angular.forEach($scope.classroom.students, function(student) {
        var count = 0;
        for (item in student.order) {
            count += (student.order[item]);
        }
        if (count > 0) {
            total++;
        }
    }, total);

    return total;
  };

  $scope.done = function() {
    $scope.classroom.ordered = true;
    Classroom.save($scope.classroom, function(err) {
      $log.debug("Saved.");
      $window.location.href ="./index.html"
    });
  }

}

function MenuController($scope, $window, $log, Menu) {
  $scope.menuItemFrequency = LunchroomConstants.menuItemFrequency;
  $scope.menu = [];
  $scope.grades = LunchroomConstants.grades;
  $scope.menuGroups = [{ misc: true, day: "Everyday" },
    { misc: false, day: "Monday" },
    { misc: false, day: "Tuesday" },
    { misc: false, day: "Wednesday" },
    { misc: false, day: "Thursday" },
    { misc: false, day: "Friday" }
  ];

  $scope.init = function() {
    $scope.menu = Menu.query();
  };

  $scope.done = function() {
    angular.forEach($scope.menu, function(item) {
      item.code = LunchroomFunctions.getMenuItemCode(item.name);
    });
    Menu.saveAll({}, $scope.menu, function() {
      $log.debug("Saved.");
      $window.location.href ="./index.html"
    });
  }
}

function MenuItemController($scope) {
  $scope.newItem = {}

  var codeExists = function(code) {
    var found = false;
    angular.forEach($scope.menu, function(item) {
      if (item.code == code) {
        found = true;
      }
    }, found);

    return found;
  }

  $scope.addItem = function() {
    $scope.newItem.code = LunchroomFunctions.getMenuItemCode($scope.newItem.name);
    $scope.newItem.day = $scope.group.day;
    $scope.newItem.misc = $scope.group.misc;
    $scope.newItem.frequency = LunchroomConstants.weeklyFrequency;
    $scope.menu.push($scope.newItem);
    $scope.newItem = {};
  };

  $scope.deleteItem = function(item) {
    $scope.menu.splice($scope.menu.indexOf(item), 1);
  };

  $scope.toggleGrade = function(item, grade) {
    item[grade.code] = !(item[grade.code]);
  }
}

function OrdersController($scope, $location, Order, Menu) {
  $scope.students = [];
  $scope.classrooms = [
    { grade: "2nd", teacher: "Mr Johnson",
      students: [
        { name: "John McDonald", order:{ 'HD':3, 'P':0 } },
        { name: "Andrew Polican", order:{ 'P':1 } },
        { name: "Mark Wahlberg", order:{ 'HD':1, 'P':1 } },
        { name: "Jack Sinnot", order:{ 'HD':3, 'P':0 } },
        { name: "Mary Smith", order:{ 'P':1 } },
        { name: "Laurie Markham", order:{ 'HD':1, 'P':1 } }
      ],
      specialRequest: "One whole pizza for student body. One make-your-own-salad for Mr Johnson."},
    { grade: "1st", teacher: "Mrs Smith",
      students: [
        { name: "John McKinsey", order:{ 'HD':3, 'P':0 } },
        { name: "Dominic Polican", order:{ 'P':1 } },
        { name: "Mark Walther", order:{ 'HD':1, 'P':1 } },
        { name: "Jack Singh", order:{ 'HD':3, 'P':0 } },
        { name: "Mary Smith", order:{ 'P':1 } },
        { name: "Debra Markham", order:{ 'HD':1, 'P':1 } }
      ] }];
  $scope.menu = [];
  $scope.noOrders = [];
  $scope.missedOrders = [];

  $scope.init = function() {
    $scope.title = $location.search().title;
    $scope.combine = $location.search().combine;
    $scope.shortlist = $location.search().shortlist;
    var grades = $location.search().grades;
    if (grades) {
      $scope.classrooms = Order.query({ "grades": grades }, function() {
        var students = [];
        var studentsWhoOrdered = [];
        angular.forEach($scope.classrooms, function(classroom) {
          students = students.concat(classroom.students);
          if (classroom.ordered) {
            var hasOrders = false;
            angular.forEach(classroom.students, function(student) {
              var studentOrdered = false;
              if (student.order) {
                for (var item in student.order) {
                  if (student.order[item]) {
                    hasOrders = true;
                    studentOrdered = true;
                  }
                }
              }
              if (studentOrdered) { studentsWhoOrdered.push(student); }
            });
            if (!hasOrders) { $scope.noOrders.push( classroom.grade + " - " + classroom.teacher )}
          } else {
            $scope.missedOrders.push(classroom.grade + " - " + classroom.teacher);
          }
        });

        if ($scope.shortlist === '1') { students = studentsWhoOrdered; }

        students.sort(function(a, b) {
            if (a.name < b.name) return -1;
            if (b.name < a.name) return 1;
            return 0;
        });

        var chunks = [];
        var i, l = students.length;
        for ( i = 0; i < l; i += 36) {
          chunks.push( students.slice(i, i + 36) );
        }

        $scope.students = students;
        $scope.studentGroups = chunks;
      });
    }
    var menu = Menu.query(function() {
      var today = LunchroomConstants.days[new Date().getDay()];
      var orderMenu = [];

      angular.forEach(menu, function(menuItem) {
        if (menuItem.day == today || menuItem.misc) {
          orderMenu.push(menuItem);
        }
      }, orderMenu);
      $scope.menu = orderMenu;
    });
  };

  $scope.getGradeSortValue = function(classroom) {
    var result;
    angular.forEach(LunchroomConstants.grades, function(grade) {
      if (grade.code === classroom.grade) {
        result = grade.sort;
      }
    }, result);
    return result;
  };

  $scope.getOrderItems = function(order) {
    var result = [];
    for (var item in order) {
      if (order[item]) {
        var count = order[item];
        for (var i = 0; i < count; i++) {
          result.push(item);
        }
      }
    }
    return result;
  }

  $scope.getDisplayName = function(itemName) {
    return LunchroomFunctions.getMenuItemDisplayName(itemName);
  };

  $scope.orderTotal = function(item) {
    var total = 0;
    angular.forEach($scope.classrooms, function(classroom) {
      angular.forEach(classroom.students, function(student) {
        for (var orderedItem in student.order) {
          if (orderedItem == item.code) {
            total += student.order[orderedItem];
          }
        }
      }, total);
    }, total);
    return total;
  }
}
