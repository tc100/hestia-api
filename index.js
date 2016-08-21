var http = require('http');
var express = require('express');
var URL = require('url');
var bodyParser = require('body-parser');

var app = express();
//rotas
var estabelecimento = require('./routes/estabelecimento');
var cardapio = require('./routes/cardapio');
var funcionario = require('./routes/funcionario');
var mongodb = require('./routes/database');

var db;
var server;
var collections = {
  "estabelecimento": "estabelecimento",
  "funcionario": "funcionario",
  "cardapio": "cardapio"
};

mongodb.connect(function(database){
  if(database != null){
    db = database;
    server = app.listen(8080, function(){
      console.log('Up, running and ready for action!');
    });
  }else{
    console.log("Não conectou no banco");
  }
});


//CAMINHOS PARA REQUISIÇÕES


//Cadastro do estabelecimento e primeiro funcionario
app.post('/apihestia/estabelecimento', function(req,res){

  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var idEstabelecimento;
//ADD ESTABELECIMENTO
  var infoEstabelecimento = JSON.parse(params.cadastro);
  var infoFuncionario = JSON.parse(params.funcionario);
  var collection = db.collection(collections.estabelecimento);
  console.log("TESTE: " + JSON.stringify(infoEstabelecimento));
  collection.insertOne(infoEstabelecimento, function(err, result) {
    if(!err){
      idEstabelecimento = result.insertedId;
      //ADD FUNCIONARIO
      infoFuncionario.restaurante = infoEstabelecimento.cnpj;
      collectionFunc = db.collection(collections.funcionario);
      collectionFunc.insertOne(infoFuncionario, function(errFunc, resultFunc) {
        if(!errFunc){
          var nomeFuncionario = infoFuncionario.nome;
          var idFuncionario = resultFunc.insertedId;
          var func = {
            "nome": nomeFuncionario,
            "id": idFuncionario
          };
          var funcionarios = [];
          funcionarios.push(func);
          collection.updateOne({_id: idEstabelecimento}, {$set: {funcionarios: funcionarios}}, function(errPut, resultPut) {
            if(!errPut){
              console.log("Cadastro Realizado com sucesso !");
              res.status(201).send("Cadastrado");
            }else{
              console.log("erro: " + errPut);
              res.status(400).send("Fail");
            }
          });
        }else{
          console.log("Erro ao adicionar: " + errFunc);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao adicionar: " + err);
      res.status(400).send("Fail");
    }
  });

});

app.post('/apihestia/funcionario', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var dados = JSON.parse(params.dados);
  var idEstabelecimento = dados.restaurante;
  collection.insertOne(dados, function(error, result){
    if(!error){
      var idFuncionario = result.insertedId;

      collection2 = db.collection(collections.estabelecimento);
      collection2.findOne({cnpj: idEstabelecimento},function(err,result){
        if(!err){
          var funcionarios = [];
          var func = {
            "nome": dados.nome,
            "id": idFuncionario
          };
          for(x in result.funcionarios){
            funcionarios.push(result.funcionarios[x]);
          }
          funcionarios.push(func);
          collection2.updateOne({cnpj: idEstabelecimento}, {$set: {funcionarios: funcionarios} }, function(errPut, resultPut) {
            if(!errPut){
              console.log("Cadastro Realizado com sucesso !");
              res.status(201).send("Cadastrado");
            }else{
              console.log("Erro ao cadastrar: " + errPut);
              res.status(400).send("Fail");
            }
          });
        }else{
          console.log("Erro ao cadastrar: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao cadastrar: " + errFunc);
      res.status(400).send("Fail");
    }
  });
});

app.get('/apihestia/login', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  collection.findOne(JSON.parse(params.login),function(err,item){
    if(!err){
      if(!item){
        console.log("Usuario nao autorizado");
        res.status(404).send("NOTAUTHORIZED")
      }else{
        console.log("Usuario autorizado");
        var aux={
          nome: item.nome,
          restaurante: item.restaurante
        };
        res.status(302).send(aux);
      }
    }else{
      console.log("err: " + err);
      res.send(404).send("ERROR");
    }
  })
});

app.get('/apihestia/getFuncs', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  collection.findOne({cnpj: params.cnpj}, function(err,item){
    if(!err){
      res.status(302).send(item);
    }else{
      console.log("error: " + err);
      res.send(404).send("ERROR");
    }
  });
});

app.get('/apihestia/getFuncionario', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var ObjectID = require('mongodb').ObjectID;
  var o_id = new ObjectID(params.id);
  collection.findOne({_id: o_id}, function(err,item){
    if(!err){
      res.status(302).send(item);
    }else{
      console.log("error: " + err);
      res.send(404).send("ERROR");
    }
  });
});

app.delete('/apihestia/funcionario/delete', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var idFuncionario = params.id;
  var cnpj = params.cnpj;
  var ObjectID = require('mongodb').ObjectID;
  var o_id = new ObjectID(idFuncionario);
  collection.updateOne({_id: o_id}, {$set: {ativo: false} }, function(errPut, resultPut) {
    if(!errPut){
      var collection2 = db.collection(collections.estabelecimento);
      collection2.findOne({cnpj:cnpj}, function(err, item){
        if(!err){
          for(x in item.funcionarios){
            if(item.funcionarios[x].id == idFuncionario){
              item.funcionarios[x].ativo = false;
              item.funcionarios[x].hora_inativo = new Date().getTime();
              break;
            }
          }
          collection2.updateOne({cnpj: cnpj}, {$set: {funcionarios: item.funcionarios} }, function(errPut2, resultPut2) {
            if(!errPut2){
              console.log("funcionario desativado");
              res.status(201).send("desativado");
            }else{
              console.log("Erro ao desativar funcionario: " + errPut2);
              res.status(400).send("Fail");
            }
          });
        }
        else{
          console.log("Erro ao desativar funcionario: " + errPut2);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao desativar funcionario: " + errPut2);
      res.status(400).send("Fail");
    }

  });
});

app.put('/apihestia/funcionario/editar', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var dados = JSON.parse(params.dados);
  var flag = false;
  var ObjectID = require('mongodb').ObjectID;
  var o_id = new ObjectID(dados.id);
  var restauranteId;
  collection.findOne({_id: o_id}, function(err,item){
    if(!err){
      if(item.nome != dados.nome){
        restauranteId = item.restaurante.toString();
        flag = true;
      }
      collection.updateOne({_id: o_id}, {$set: {nome: dados.nome, login: dados.login, senha: dados.senha} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Alterado com sucesso ! "+ resultPut);
          if(flag){
            var collection2 = db.collection(collections.estabelecimento);
            collection2.findOne({cnpj: restauranteId}, function(err2,item2){
              if(!err){
                for(x in item2.funcionarios){
                  if(item.nome == item2.funcionarios[x].nome){
                    item2.funcionarios.splice(x,1);
                    var func = {
                      'nome': dados.nome,
                      'id': dados.id
                    };
                    item2.funcionarios.push(func);
                  }
                }
                collection2.updateOne({cnpj: restauranteId}, {$set: {funcionarios: item2.funcionarios}}, function(errPut2, resultPut2) {
                  if(!err){
                    console.log("estabelecimento alterado");
                    res.status(201).send("Alterado");
                  }else{
                    console.log("Erro ao achar estabelecimento: " + errPut2);
                    res.status(400).send("Fail");
                  }
                });
              }else{
                console.log("Erro ao achar estabelecimento: " + err2);
                res.status(400).send("Fail");
              }
            });
          }else{
            res.status(201).send("Alterado");
          }
        }else{
          console.log("Erro ao Alterar funcionario: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("error: " + err);
      res.send(404).send("ERROR");
    }
  });
})

/*
var server = http.createServer(function (req, res) {
     parsedURL = URL.parse(req.url, true);
     var path = parsedURL.pathname;
     //console.log("path: " + JSON.stringify(parsedURL));
     var query = parsedURL.query;
     //console.log("query: " + JSON.stringify(query));
    // var teste = JSON.parse(query.cadastro);

     switch (path) {
       case '/apihestia/estabelecimento':
           if (query != null) {
              var cadastro = JSON.parse(query.cadastro);
              var funcionarioIns = JSON.parse(query.funcionario);
              console.log("funcionario: "+JSON.stringify(funcionarioIns));
              console.log("estabelecimento: "+JSON.stringify(cadastro));
              funcionario.inserirFuncionario(funcionarioIns);
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
});*/
