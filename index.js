var http = require('http');
var URL = require('url');

//rotas
var estabelecimento = require('./routes/estabelecimento');
var cardapio = require('./routes/cardapio');
var funcionario = require('./routes/funcionario');

var server = http.createServer(function (req, res) {
     parsedURL = URL.parse(req.url, true);
     var path = parsedURL.pathname;
     console.log("path: " + JSON.stringify(parsedURL));
     var query = parsedURL.query;
     console.log("query: " + JSON.stringify(query));
     var teste = JSON.parse(query.cadastro);

     switch (path) {
       case '/apihestia/estabelecimento':
           if (query != null) {
              var cadastro = JSON.parse(query.cadastro);
              var funcionario = JSON.parse(query.funcionario);
              //console.log("funcionario: "+query.funcionario);
              funcionario.insertFuncionario(funcionario);
              estabelecimento.fazerCadastro(cadastro);
              res.writeHead(200);
              res.end("OK");
           }
           break;
        case '/apihestia/cardapio':

          break;
        case '/apihestia/funcionario':

          break;

       default:
        res.writeHead(400);
        res.end('Caminho não encontrado !');
    }
});



server.listen(8080);
console.log('Up, running and ready for action!');
