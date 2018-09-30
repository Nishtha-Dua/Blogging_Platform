var http = require('http'),
fs = require('fs'),
express = require('express'),
session = require('express-session');
app = express();
router = express.Router();
server = require('http').createServer(app),
bodyParser = require('body-parser'),
assert = require('assert'),
mongo = require('mongodb').MongoClient,
hbs = require('express-handlebars'),
path = require('path');

var urlencodedParser = bodyParser.urlencoded({extended: false});
var url = 'mongodb://localhost:27017';

server.listen('8080');

app.use(session({secret:'shh', resave: false, saveUninitialized: true}));

app.engine('hbs',hbs({extname: 'hbs', dfaultLayout: 'layout', layoutDir: __dirname + '/views/layout'}));
app.engine('hbs',hbs({extname: 'hbs', partialsDir: __dirname + '/views/partials'}));
app.set('view engine', 'hbs');
app.set('views' + __dirname + 'views');

app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/Pictures', express.static(__dirname + '/Pictures'));
app.use('/stylesheet', express.static(__dirname + '/stylesheet'));

app.use('/', router);

app.get('/', function(req, res, next) {
  res.render(__dirname + '/views/blog');
});

router.get('/about', function(req, res, next){
  if(req.session.result)
  {
    res.render('welcome',{user_name: req.session.result.name});
  }
});

router.get('/write', function(req, res,next){
  if(req.session.result)
  {
  res.render('write',{user_name: req.session.result.name});

  app.post('/write', urlencodedParser, function(req, res){
    response = {
      category: req.body.category,
      subject: req.body.subject,
      blog: req.body.blog,
      name: req.session.result.name,
      userid: req.session.result._id,
      email: req.session.result.email
    };

  mongo.connect(url, function(err, client)
  {
      var db = client.db('blog');
      assert.equal(null,err);
      db.collection('writeblog').insert(response, function(err, resultfir)
      {
      if(!err)
      {
      assert.equal(null,err);
      console.log("blog inserted");
      res.render('write',{writemsg: "Your Blog has been submitted!!", user_name:req.session.result.name })
    }
    else {
      res.render('write',{writeerr: "Oops..Something went wrong", user_name: req.session.result.name});
    }
  });
    client.close();
  });
  });
}
});

router.get('/read', function(req, res, next){
  if(req.session.result)
  {
    var resultarray = [];
    mongo.connect(url, function(err, client) {
      var db = client.db('blog');
      assert.equal(null, err);
      var cursor = db.collection('writeblog').find({});
      cursor.forEach(function (doc, err) {
        assert.equal(null, err);
        resultarray.push(doc);
      }, function() {
        client.close();
        res.render('read', {items: resultarray, user_name: req.session.result.name});
      });
    });
}

});

router.get('/contact', function(req, res, next){
  if(req.session.result)
  {
  res.render('contactus',{user_name: req.session.result.name});

  app.post('/contact', urlencodedParser, function(req, res){
    response = {
      name: req.session.result.name,
      userid: req.session.result._id,
      contact: req.body.contact,
      ques: req.body.ques
    };

  mongo.connect(url, function(err, client)
  {
      var db = client.db('blog');
      assert.equal(null,err);
      db.collection('query').insert(response, function(err, resultird)
      {
      if(!err)
      {
      assert.equal(null,err);
      console.log("query inserted");
      res.render('contactus',{writemsg: "Your query has been submitted!!", user_name:req.session.result.name })
    }
    else {
      res.render('contactus',{writeerr: "Oops..Something went wrong", user_name: req.session.result.name});
    }
  });
    client.close();
  });
  });
}
});

router.get('/logout', function(req, res)
{
  req.session.destroy(function(err) {
    res.redirect('/');
  });
});

app.post('/insert', urlencodedParser, function(req, res, next){
  response = {
    name: req.body.user,
    email: req.body.email,
    password: req.body.pass
  };

  mongo.connect(url, function(err, client) {
    if(!err)
    {
    var db = client.db('blog');
    assert.equal(null, err);
    db.collection('register').insert(response, function(err, result)
   {
    assert.equal(null, err);
    console.log("item inserted");
   });
  res.render('blog',{msg: "Congratulations!! You are now registered"});
   }
  else {
  res.render('blog',{msg: "Oops!! Try again later"});
   }
  client.close();
  });
  });

app.post('/login', urlencodedParser, function(req, res) {

  mongo.connect(url, function(err, client)
{
var db = client.db('blog');
assert.equal(null, err);
db.collection('register').findOne({email: req.body.email}, function(err, result)
{
  if(result === null)
  {
    console.log("login invalid");
    res.render('blog',{msg: "Oops..This email does not exist!!"});
  }
  else if (result.email === req.body.email && result.password === req.body.pass)
  {
    req.session.result = result;
    console.log("matched");
    res.redirect('/about');

  }
  else {
  console.log("error");
  res.render('blog',{msg: "Oops...Invalid password!!"});
  }
});
});

});
