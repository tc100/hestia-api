var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var properties = require('../properties/dbproperties');

exports.connect = function(callback){
  var url = properties.url;
  mongoClient.connect(url, function(error, database){
    console.log("Connected to database");
    callback(database);
  });
};
