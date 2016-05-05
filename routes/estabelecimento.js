var database = require('./database');

exports.fazerCadastro = function() {

  return "HELLO";
};

/* sem usar função generica*/
function findAll(req, res) {
	database.find('estabelecimento', {}, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resources));
	});
};

function findById(req, res) {
	database.find('estabelecimento', {'_id': id}, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resources));
	});
};
