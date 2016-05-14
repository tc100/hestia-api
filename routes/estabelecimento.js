var database = require('./database');
var api = require('./api');



/**
 * Esta é uma função que executa a busca (GET)
 * de dados de uma coleção - passa por parametro de acordo com a query
 *
 * @param   {JSON}  query   O Filtro de dados para haver o retorno certo
 * @param   {}      res
 */
function findEstabelecimento(query, res) {
	api.find('estabelecimento', query, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(query));
	});
};

/**
 * Esta é uma função que executa a inserção ou atualização (POST/PUT)
 * de dados de uma coleção - passa por parametro
 *
 * @param   {JSON}  resource  Conjunto de dados JSON que irá ser inserido
 * @param   {}      res
*/
var insertEstabelecimento = function (resource, res) {
	api.insert('estabelecimento', resource, function (err, resource) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resource));
	});
};

exports.fazerCadastro = function (resource, res) {
  database.connect(function (db) {
		console.log("db: " + db);
    var collection = db.collection("estabelecimento");
    collection.insert(resource, function(err, result) {
        if(!err){
        console.log("Adicionado em estabelecimento com sucesso: " + JSON.stringify(result));
        }else{
          console.log("Erro ao adicionar");
        }
        db.close();
    });
  })/*
	api.insert('estabelecimento', resource, function(err,resource){
		if(!err){
			console.log("Adicionado em estabelecimento com sucesso: " + JSON.stringify(resource));

		}else{
			console.log("Erro ao adicionar");
		}
	})*/
};
