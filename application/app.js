var express = require('express');
var app=express();
var bodyParse = require('body-parser');
var fs = require('fs');
var http = require("http");
var queryString = require("querystring");
//var session = require("express-session");

app.use(express.static('public'));
app.use(bodyParse.urlencoded({extended:"false"}));

var server = app.listen(3001, function() {
  var port = server.address().port;
  console.log("Server started at Port %s!", port);
})

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get("/secure",function(req,res){
  res.sendFile(__dirname + "/secure/secure.html");
});

app.post('/', function(req,res){
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
      'SentBy':'3001'
    }
  };

  var post_req = http.request(postDetails,function(resp){
    resp.setEncoding("utf8");
    resp.on('data', function(chunk){
      var token = JSON.parse(chunk);






      //AHOY AHOY AHOY
      if (token.token == "true") { res.send("http://localhost:3001/secure/"); }
    });
  });

  post_req.write(data);
  post_req.end();
});
