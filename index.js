var http = require('http');
var express = require('express');
var URL = require('url');
var bodyParser = require('body-parser');
var _ = require("underscore");

var app = express();
//rotas
var estabelecimento = require('./routes/estabelecimento');
var cardapio = require('./routes/cardapio');
var funcionario = require('./routes/funcionario');
var mongodb = require('./routes/database');
var cfenv = require('cfenv');

var db;
var server;
var collections = {
  "estabelecimento": "estabelecimento",
  "funcionario": "funcionario",
  "cardapio": "cardapio",
};

var appEnv = cfenv.getAppEnv();

mongodb.connect(function(database){
  if(database != null){
    db = database;
    server = app.listen(appEnv.port, '0.0.0.0', function() {
      console.log("server starting on " + appEnv.url);
    });
  }else{
    console.log("Não conectou no banco");
  }
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//CAMINHOS PARA REQUISIÇÕES


//Cadastro do estabelecimento e primeiro funcionario
app.post('/apihestia/estabelecimento', function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var idEstabelecimento;
  //ADD ESTABELECIMENTO
  var infoEstabelecimento = JSON.parse(params.cadastro);
  infoEstabelecimento.avaliacao = 0;
  infoEstabelecimento.comentario = 0;
  infoEstabelecimento.comentarios = [];
  var infoFuncionario = JSON.parse(params.funcionario);
  var collection = db.collection(collections.estabelecimento);
  infoEstabelecimento.data = time;
  collection.insertOne(infoEstabelecimento, function(err, result) {
    if(!err){
      idEstabelecimento = result.insertedId;
      //ADD FUNCIONARIO
      infoFuncionario.restaurante = infoEstabelecimento._id;
      collectionFunc = db.collection(collections.funcionario);
      collectionFunc.insertOne(infoFuncionario, function(errFunc, resultFunc) {
        if(!errFunc){
          var nomeFuncionario = infoFuncionario.nome;
          var idFuncionario = resultFunc.insertedId;
          var func = {
            "nome": nomeFuncionario,
            "id": idFuncionario,
            "data": time
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

app.get('/apihestia/estabelecimentos', function(req,res){
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  collection.find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    res.send(docs);
  })
});

app.get('/apihestia/verificarCnpj', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var cnpj = params.cnpj;
  var collection = db.collection(collections.estabelecimento);
  var flag = false;

  collection.find({}).toArray(function(err, docs) {
    for(x in docs){
      console.log("cnpj: " + docs[x].cnpj + " E " + cnpj);
      if(docs[x].cnpj == cnpj.toString()){
        flag = true;
        break;
      }
    }
    if(flag){
      res.send("JAEXISTE");
    }else{
      res.send("NAOEXISTE")
    }
  })
});

app.get('/apihestia/verificarLogin', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var login = params.login;
  var collection = db.collection(collections.funcionario);
  var flag = false;

  collection.find({"login": login}).toArray(function(err, docs) {
    console.log("Found the following records: " + JSON.stringify(docs));
    if(docs.length > 0){
      res.send("JAEXISTE");
    }else{
      res.send("NAOEXISTE")
    }
  })
});

app.post('/apihestia/funcionario', function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var dados = JSON.parse(params.dados);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(dados.restaurante);
  collection.insertOne(dados, function(error, result){
    if(!error){
      var idFuncionario = result.insertedId;

      collection2 = db.collection(collections.estabelecimento);
      collection2.findOne({_id: idEstabelecimento},function(err,result){
        if(!err){
          var funcionarios = [];
          var func = {
            "nome": dados.nome,
            "id": idFuncionario,
            "data": time
          };
          for(x in result.funcionarios){
            funcionarios.push(result.funcionarios[x]);
          }
          funcionarios.push(func);
          collection2.updateOne({_id: idEstabelecimento}, {$set: {funcionarios: funcionarios} }, function(errPut, resultPut) {
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
        if(typeof item.ativo == "undefined" || item.ativo != false){
          var aux={
            nome: item.nome,
            restaurante: item.restaurante,
            privilegio: item.privilegio
          };
          res.status(302).send(aux);
        }else{
          console.log("Usuario nao autorizado");
          res.status(404).send("NOTAUTHORIZED")
        }
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

app.get('/apihestia/getRestaurante', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
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

app.put('/apihestia/restaurante/editar', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var dados = JSON.parse(params.dados);
  var flag = false;
  var ObjectID = require('mongodb').ObjectID;
  var o_id = new ObjectID(dados.id);
  collection.findOne({_id: o_id}, function(err,item){
    if(!err){
      collection.updateOne({_id: o_id}, {$set: {nomerestaurante: dados.nomerestaurante, cnpj: dados.cnpj, cep: dados.cep, email: dados.email, telefone: dados.telefone, endereco: dados.endereco, cidade: dados.cidade, estado: dados.estado} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Alterado com sucesso ! "+ resultPut);
          res.status(201).send("Alterado");
        }
        else{
          console.log("Erro ao Alterar restaurante: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("error: " + err);
      res.send(404).send("ERROR");
    }
  });
})

app.delete('/apihestia/funcionario/delete', function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.funcionario);
  var idFuncionario = params.id;
  var ObjectID = require('mongodb').ObjectID;
  var o_id = new ObjectID(idFuncionario);
  var idRestaurante = new ObjectID(params.idRestaurante);
  collection.updateOne({_id: o_id}, {$set: {ativo: false} }, function(errPut, resultPut) {
    if(!errPut){
      var collection2 = db.collection(collections.estabelecimento);
      collection2.findOne({_id: idRestaurante}, function(err, item){
        if(!err){
          for(x in item.funcionarios){
            if(item.funcionarios[x].id == idFuncionario){
              item.funcionarios[x].ativo = false;
              item.funcionarios[x].hora_inativo = new Date().getTime();
              break;
            }
          }
          collection2.updateOne({_id: idRestaurante}, {$set: {funcionarios: item.funcionarios} }, function(errPut2, resultPut2) {
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
        restauranteId = new ObjectID(item.restaurante.toString());
        flag = true;
      }
      collection.updateOne({_id: o_id}, {$set: {nome: dados.nome, login: dados.login, senha: dados.senha, privilegio: dados.privilegio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Alterado com sucesso ! "+ resultPut);
          if(flag){
            var collection2 = db.collection(collections.estabelecimento);
            collection2.findOne({_id: restauranteId}, function(err2,item2){
              if(!err2){
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
                collection2.updateOne({_id: restauranteId}, {$set: {funcionarios: item2.funcionarios}}, function(errPut2, resultPut2) {
                  if(!errPut2){
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
//clonar cardapio /apihestia/cardapio/clonar
app.post("/apihestia/cardapio/clonar", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio;
      nomeCardapio = params.nome_clonar;
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          cardapio = JSON.parse(JSON.stringify(arrayCardapio[x]));
          break;
        }
      }
      cardapio.nome = params.novo_cardapio;
      cardapio.data = time;
      cardapio.ativo = false;
      arrayCardapio.push(cardapio);
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Cadastro de cardapio Realizado com sucesso !");
          res.status(201).send(cardapio);
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao cadastrar cardapio: " + errPut);
      res.status(400).send("Fail");
    }
  });
});

//adicionar novo cardapio
app.post("/apihestia/cardapio/novo", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var jsonCardapio = {};
      jsonCardapio.nome = params.cardapio;
      jsonCardapio.categorias = [{
        'nome': "Pratos Prinicipais",
        'pratos': []
      }];
      jsonCardapio.data = time;
      jsonCardapio.acompanhamentos = [];
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      if(arrayCardapio.length == 0 ){
        jsonCardapio.ativo = true;
      }else{
        jsonCardapio.ativo = false;
      }
      arrayCardapio.push(jsonCardapio);
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Cadastro de cardapio Realizado com sucesso !");
          res.status(201).send("Cadastrado");
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao cadastrar cardapio: " + errPut);
      res.status(400).send("Fail");
    }
  });
})

//get all cardapios
app.get("/apihestia/cardapios", function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      res.status(201).send(arrayCardapio);
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
});

//get nome estabelecimento
app.get("/apihestia/getNomeEstabelecimento", function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var nomeRestaurante;
      nomeRestaurante = result.nomerestaurante;
      res.status(201).send(nomeRestaurante);
    }else{
      res.status(400).send("Fail");
    }
  });
});

//get one cardapio
app.get("/apihestia/cardapio", function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          cardapio = arrayCardapio[x];
          break;
        }
      }
      res.status(201).send(cardapio);
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

//add acompanhamento
app.post("/apihestia/acompanhamento", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  console.log(params.acompanhamento);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      var acompanhamento = {};
      acompanhamento.nome = JSON.parse(params.acompanhamento);
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          acompanhamento = JSON.parse(params.acompanhamento);
          acompanhamento.data = time;
          arrayCardapio[x].acompanhamentos.push(acompanhamento);
          break;
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Cadastro de cardapio Realizado com sucesso !");
          res.status(201).send("Cadastrado");
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/editarAtivoCardapio", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      var flag
      for(x in arrayCardapio){
        if(params.ativo){
          if(arrayCardapio[x].nome != nomeCardapio){
            arrayCardapio[x].ativo = "false";
          }
        }
        if(arrayCardapio[x].nome == nomeCardapio){
          arrayCardapio[x].ativo = params.ativo;
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          res.status(201).send("Alterado");
        }else{
          console.log("Erro ao des/ativar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao des/ativar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/deleteAcompanhamento", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      var acompanhamento = params.acompanhamento;
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          for(y in arrayCardapio[x].acompanhamentos){
            if(arrayCardapio[x].acompanhamentos[y].nome == acompanhamento){
              arrayCardapio[x].acompanhamentos.splice(y,1);
              break;
            }
          }
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Acompanhamento deletado com sucesso !");
          res.status(201).send("Deletado");
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/categoria", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      var categoria={
        'nome': params.categoria,
        'pratos': [],
        'data': time
      };
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          arrayCardapio[x].categorias.push(categoria);
          break;
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Cadastro de cardapio Realizado com sucesso !");
          res.status(201).send("Cadastrado");
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/deleteCategoria", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          for(y in arrayCardapio[x].categorias){
            if(arrayCardapio[x].categorias[y].nome == params.categoria){
              arrayCardapio[x].categorias.splice(y,1);
              break;
            }
          }
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Cardapio deletado com sucesso !");
          res.status(201).send("Deletado");
        }else{
          console.log("Erro ao deletar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

//get all comentarios
app.get("/apihestia/comentarios", function(req,res){
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayComentarios = [];
      if(typeof result.comentarios != "undefined" && result.comentarios != null && result.comentarios.length != 0){
        arrayComentarios = result.comentarios;
      }
      res.status(201).send(arrayComentarios);
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
});

//adicionar novo cardapio
app.post("/apihestia/comentarios", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayComentarios = [];
      var avaliacao = 0;
      var num = 0;
      if(typeof result.comentarios != "undefined" && result.comentarios != null && result.comentarios.length != 0){
        arrayComentarios = result.comentarios;
        num = result.comentario;
        avaliacao = result.avaliacao;
      }
      var comentario = JSON.parse(params.comentario);
      avaliacao = ((avaliacao*num)+comentario.nota)/(num+1);
      avaliacao = Math.round(avaliacao*100)/100;
      num = num + 1;
      arrayComentarios.push(comentario);
      collection.updateOne({_id: idEstabelecimento}, {$set: {comentarios: arrayComentarios, avaliacao:avaliacao, comentario:num} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Comentario Realizado com sucesso !");
          res.status(201).send("Cadastrado");
        }else{
          console.log("Erro ao comentar: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao comentar: " + errPut);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/prato", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  var nomeCategoria = params.categoria;
  var prato = JSON.parse(params.prato);
  var editar = params.editar;

  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          for(y in arrayCardapio[x].categorias){
            if(arrayCardapio[x].categorias[y].nome == nomeCategoria){
              if(editar != ""){
                for(z in arrayCardapio[x].categorias[y].pratos){
                  if(arrayCardapio[x].categorias[y].pratos[z].nome == editar){
                    arrayCardapio[x].categorias[y].pratos.splice(z,1);
                    arrayCardapio[x].categorias[y].pratos.push(prato);
                    break;
                  }
                }
              }else{
                arrayCardapio[x].categorias[y].pratos.push(prato);
                break;
              }
            }
          }
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Prato adicionado/atualizado Realizado com sucesso !");
          res.status(201).send("Cadastrado");
        }else{
          console.log("Erro ao cadastrar cardapio: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})

app.post("/apihestia/deletePrato", function(req,res){
  var time = new Date().getTime();
  var parsedURL = URL.parse(req.url,true);
  var params = parsedURL.query;
  var collection = db.collection(collections.estabelecimento);
  var ObjectID = require('mongodb').ObjectID;
  var idEstabelecimento = new ObjectID(params.restaurante);
  var nomeCardapio = params.cardapio;
  var nomeCategoria = params.categoria;
  var prato = JSON.parse(params.prato);

  collection.findOne({_id: idEstabelecimento}, function(error, result){
    if(!error){
      var arrayCardapio = [];
      var cardapio = "";
      if(typeof result.cardapios != "undefined" && result.cardapios != null && result.cardapios.length != 0){
        arrayCardapio = result.cardapios;
      }
      for(x in arrayCardapio){
        if(arrayCardapio[x].nome == nomeCardapio){
          for(y in arrayCardapio[x].categorias){
            if(arrayCardapio[x].categorias[y].nome == nomeCategoria){
              for(z in arrayCardapio[x].categorias[y].pratos){
                if(arrayCardapio[x].categorias[y].pratos[z].nome == prato.nome){
                  arrayCardapio[x].categorias[y].pratos.splice(z,1);
                  break;
                }
              }
            }
          }
        }
      }
      collection.updateOne({_id: idEstabelecimento}, {$set: {cardapios: arrayCardapio} }, function(errPut, resultPut) {
        if(!errPut){
          console.log("Prato deletado com sucesso !");
          res.status(201).send("Deletado");
        }else{
          console.log("Erro ao Deletar prato: " + errPut);
          res.status(400).send("Fail");
        }
      });
    }else{
      console.log("Erro ao pegar cardapios: " + error);
      res.status(400).send("Fail");
    }
  });
})
