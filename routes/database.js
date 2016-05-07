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

/**
 * Esta é uma função que executa a busca (GET)
 * de dados de uma coleção - passa por parametro de acordo com a query
 *
 * @example
 *   find('cardapio', {});
 *
 * @param   {String} collectionName   Nome da Coleção onde será inserido os dados
 * @param   {JSON} query    O Filtro de dados para haver o retorno certo
 * @returns {JSON}
 */
exports.find = function (collectionName, query) {
  connect(function (database) {
    var collection = database.collection(collectionName);
    collection.find(query).toArray(
      function (err, documents) {
        assert.equal(err, null);
        console.log("MongoDB returned the following documents:");
        console.dir(documents);
        database.close();
    })
  })
};
/**
 * Esta é uma função que executa a inserção ou atualização (POST/PUT)
 * de dados de uma coleção - passa por parametro
 *
 * @example
 *   insert('cardapio', {'nome':'cardapio-hestia', 'tipo':'opcionais'});
 *
 * @param   {String} collectionName   Nome da Coleção onde será inserido os dados
 * @param   {JSON} resource    Conjunto de dados JSON que irá ser inserido
 */
exports.insert = function (collectionName, resource) {
  connect(function (database) {
    var collection = database.collection(collectionName);
    collection.insertOne(
      resource,function(err, r) {
        assert.equal(null, err);
        assert.equal(1, r.insertedCount);
        console.log(collectionName +" Inserted in database");
        database.close();
    });
  })
};
