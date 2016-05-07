var database = require('./database');

exports.fazerCadastro = function() {

  return "HELLO";
};


/**
 * Esta é uma função que executa a busca (GET)
 * de dados de uma coleção - passa por parametro de acordo com a query
 *
 * @example
 *   findAll('cardapio', {});
 *
 * @param   {JSON}  query   O Filtro de dados para haver o retorno certo
 * @param   {}      res
 */
function findEstabelecimento(query, res) {
	database.find('estabelecimento', query, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(query));
	});
};

/**
 * Esta é uma função que executa a inserção ou atualização (POST/PUT)
 * de dados de uma coleção - passa por parametro
 *
 * @example
 *   insert('cardapio', {'nome':'cardapio-hestia', 'tipo':'opcionais'});
 *
 * @param   {JSON}  resource  Conjunto de dados JSON que irá ser inserido
 * @param   {}      res
*/
var insertEstabelecimento = function (resource, res) {
	database.insert('estabelecimento', resource, function (err, resource) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resource));
	});
};
