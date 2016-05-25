var database = require('./database');
var api = require('./api');



/**
 * Esta é uma função que executa a busca (GET)
 * de dados de uma coleção - passa por parametro de acordo com a query
 *
 * @param   {JSON}  query   O Filtro de dados para haver o retorno certo
 * @param   {}      res
 */
function findFuncionario(query, res) {
	api.find('funcionario', query, function (err, resources) {
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
var insertFuncionario = function (resource, res) {
	api.insert('funcionario', resource, function (err, resource) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resource));
	});
};

exports.inserirFuncionario = function (resource, res) {
  database.connect(function (db) {
		console.log("db: " + db);
    var collection = db.collection("funcionario");
    collection.insert(resource, function(err, result) {
        if(!err){
        console.log("Adicionado em funcionario com sucesso: " + JSON.stringify(result));
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
