var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var properties = require('../properties/dbproperties');

exports.connect = function(callback){
  var url = properties.url;
  console.log("teste: " + url);

  mongoClient.connect(url, function(error, database){
    console.log("foi");

    console.log("Connected to database");
    callback(database);
  });
};

exports.teste = function(){
  connect(function(database){
    console.log("funfouu");
  })
};
