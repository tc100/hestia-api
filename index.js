var http = require('http');
var URL = require('url');

//rotas
var estabelecimento = require('./routes/estabelecimento');
var cardapio = require('./routes/cardapio');
var funcionario = require('./routes/funcionario');

var server = http.createServer(function (req, res) {
     var parsedURL = URL.parse(req.URL, true);

     switch (parsedURL.pathname) {
       case '/apihestia/estabelecimento':
           if (parsedURL.query.cadastro) {
              estabelecimento.fazerCadastro();
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
