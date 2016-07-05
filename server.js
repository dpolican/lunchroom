/**
 * Created by Domingo Polican on 11/17/13.
 */
var express = require('express');
require('express-namespace');
var configs = require('./configs');
var fs = require('fs');
var util = require('util');
var app = express();

var lunchroomData = {};

var ensureCurrentDay = function() {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var day = today.getDate();
  var lastDate = null;
  if (lunchroomData.date) {
    lastDate = new Date(lunchroomData.date);
  }
  if (!lastDate
    || lastDate.getFullYear() !== year
    || lastDate.getMonth() !== month
    || lastDate.getDate() !== day) {

    var filename = "./data.yesterday";
    fs.writeFile(filename, JSON.stringify(lunchroomData), function(saveError) {
      if(saveError) {
        console.log(saveError);
      }
    });

    if (lunchroomData.classrooms) {
      lunchroomData.classrooms.forEach(function(classroom, index, array) {
        if (classroom.students) {
          classroom.students.forEach(function(student, studentIndex, studentArray) {
            student.order = {};
          });
        }
        classroom.specialRequest = '';
        classroom.ordered = false;
      });
    }

    lunchroomData.date = today;
  }
};

var persistData = function() {
  fs.rename("./data.json", "./data.backup", function(renameError) {
    if (renameError) {
      console.log(renameError);
    }
  });
  fs.writeFile("./data.json", JSON.stringify(lunchroomData), function(saveError) {
    if(saveError) {
      console.log(saveError);
    }
  })
}

fs.readFile("./data.json", 'utf8', function(err, data) {
  if (data) {
    lunchroomData = JSON.parse(data);
  } else {
    lunchroomData = { "classrooms": [] };
  }
});

//app.use(express.logger());
app.use('/lunchroom', express.static(__dirname + '/public'));
app.use(express.bodyParser());

app.namespace('/lunchroom', function() {
    app.get('/classroom/:id', function(req, res) {
        if (lunchroomData.classrooms) {
            ensureCurrentDay();
            lunchroomData.classrooms.forEach(function(element, index, array) {
                if (element.id == req.params.id) {
                    res.type('application/json');
                    res.send(JSON.stringify(element));
                    return true;
                }
            });
        }
    });
    app.get('/classroom', function(req, res) {
        ensureCurrentDay();
        res.type('application/json');
        res.send(JSON.stringify(lunchroomData.classrooms));
    });

    app.post('/classroom/:id', function(req, res) {
        var match = false;
        lunchroomData.classrooms.forEach(function(classroom, index, array) {
            if (classroom.id === req.body.id) {
                array[index] = req.body;
                match = true;
            }
        });
        if (!match) {
            lunchroomData.classrooms.push(req.body);
        }
        persistData();
        res.json(true);
    });

    app.post('/classroom', function(req, res) {
        if (util.isArray(req.body)) {
            lunchroomData.classrooms = req.body;
            persistData();
        }
        res.json([]);
    });

    app.get('/menu', function(req, res) {
        res.type('application/json');
        res.send(JSON.stringify(lunchroomData.menu));
    });

    app.post('/menu', function(req, res) {
        if (util.isArray(req.body)) {
            lunchroomData.menu = req.body;
            persistData();
        }
        res.json([]);
    });

    app.get('/order', function(req, res) {
        ensureCurrentDay();
        var grades = req.param('grades');
        if (!util.isArray(grades)) {
            var grade = grades;
            grades = new Array();
            grades.push(grade);
        }
        var classrooms = [];
        lunchroomData.classrooms.forEach(function(classroom, index, array) {
            if (grades.indexOf(classroom.grade) > -1) {
                classrooms.push(classroom);
            }
        });
        res.type('application/json');
        res.send(JSON.stringify(classrooms));
    });
});

app.listen(process.env.PORT || 3000);
