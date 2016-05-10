var http = require('http');
var URL = require('url');

//rotas
var estabelecimento = require('./routes/estabelecimento');
var cardapio = require('./routes/cardapio');
var funcionario = require('./routes/funcionario');

var server = http.createServer(function (req, res) {
     parsedURL = URL.parse(req.url, true);
     var path = parsedURL.pathname;
     var query = parsedURL.query;
     switch (path) {
       case '/apihestia/estabelecimento':
           if (query != null) {
              estabelecimento.fazerCadastro(query);
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
