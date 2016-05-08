var database = require('./api');
/**
 * Esta é uma função que executa a busca (GET)
 * de dados de uma coleção - passa por parametro de acordo com a query
 *
 * @param   {JSON}  query   O Filtro de dados para haver o retorno certo
 * @param   {}      res
 */
function findFuncionario(query, res) {
	database.find('funcionario', query, function (err, resources) {
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
	database.insert('funcionario', resource, function (err, resource) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resource));
	});
};
