var express = require('express');
var app=express();
var bodyParse = require('body-parser');
var fs = require('fs');
var http = require("http");
var queryString = require("querystring");
var session = require("express-session");
var passport = require("passport");
var sess;

app.use(express.static('public'));
app.use(bodyParse.urlencoded({extended:"false"}));


var server = app.listen(3002, function() {
  var port = server.address().port;
  console.log("Server started at Port %s!", port);
});

app.get('/', function(req,res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get("/secure", function(req,res){
  console.log(req.session);
  if(req.session){
    res.sendFile(__dirname + "/secure/secure.html");
  }
  else {
    //req.session.destroy();
    res.sendFile(__dirname + "/public/error.html");
  }
});

app.post('/', function(req,res) {
  var username_node = req.body.username;
  var password_node = req.body.password;
  var token = {"token":"false"};

  fs.readFile('loginfo/loginfo.json', function (err, data) {
    if (err) { return console.error(err); }
    var json = JSON.parse(data);

    for(var key in json){
      //console.log(json[key].application);
      if(json[key].username == username_node && json[key].password == password_node && json[key].application == "app1") {
        if(req.headers.sentby == '3001') {
          token = {"token":"true"};
        }
        else if(req.headers.sentby == '3002' && json[key].admin == true) {
          token = {"token":"true"};
        }
      }
    }
    res.send(token);
  });
  res.set('Access-Control-Allow-Origin', '*');
});

app.post('/admin', function(req,res){
  var username_node = new Buffer(req.body.un).toString('base64');
  var password_node = new Buffer(req.body.pw).toString('base64');
  //console.log(new Buffer(password_enco, 'base64').toString('ascii'));
  var logInfo = {
    "username":username_node,
    "password":password_node
  };
  var data = queryString.stringify(logInfo);
  var postDetails = {
    host:"localhost",
    port:"3002",
    path:"http://localhost:3002",
    method:"POST",
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'SentBy':'3002'
    }
  };

  var post_req = http.request(postDetails,function(resp){
    resp.setEncoding("utf8");
    resp.on('data', function(chunk){
      var token = JSON.parse(chunk);
      if (token.token == "true") {
        sess = app.use(session({
          secret: "erikerikerik",
          cookie:{maxAge:1},
          resave:false,
          saveUninitialized:false
        }));
        res.send("http://localhost:3002/secure/");
      }
    });
  });

  post_req.write(data);
  post_req.end();
});

app.post('/addUser', function(req,res){
  res.set('Access-Control-Allow-Origin', '*');
  var username_toAdd = new Buffer(req.body.un).toString('base64');
  var password_toAdd = new Buffer(req.body.pw).toString('base64');
  //DONT ENCODE HERE, ENCODE IN secure.html
  var newUser = {"username":username_toAdd,"password":password_toAdd};

  fs.readFile(__dirname + "/loginfo/loginfo.json", function(err, data){
    if(err) { return console.log(err); }
    var json = JSON.parse(data);
    var exists = false;

    for (var key in json){
      if(json[key].username == username_toAdd && json[key].password == password_toAdd) {
        exists = true;
      }
    }

    if(!exists) {
      var configFile = fs.readFileSync(__dirname + "/loginfo/loginfo.json");
      var config = JSON.parse(configFile);
      config.push(newUser);
      var configJSON = JSON.stringify(config);
      fs.writeFileSync(__dirname + "/loginfo/loginfo.json",configJSON);
    }
  });
})
