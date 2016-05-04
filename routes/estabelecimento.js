var database = require('./database');

exports.fazerCadastro = function() {

  return "HELLO";
};

/*Genérico - aqui é o que eu falei q poderia estar em outra classe, pois qlqr
**Colection pode usar pode*/
function findAll(colectionName, req, res) {
	database.find(colectionName, {}, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resources));
	});
};
function findById(colectionName, req, res) {
	database.find(colectionName, {'_id': id}, function (err, resources) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(resources));
	});
};

exports.findAllEstabelecimento = function (req, res) {
	findAll('estabelecimento', req, res);
};

exports.findByIdEstabelecimento = function (req, res) {
	findAll('estabelecimento', req, res);
};

/* sem usar função generica
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
};*/
