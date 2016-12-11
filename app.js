var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var viewPath = path.join(__dirname, 'views');
var sf_auth  = require('./sf_auth');
var sf_data = new sf_auth();
var app = express();

var port = process.env.PORT || 3000;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing 

// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
// Make our db accessible to our router
// app.use(function(req,res,next){
   
// });
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'node_modules')));

// app.use('/', routes);
// app.use('/', function (req, res) {
  
//    res.sendFile("index.html" );
// })

app.get('/', function (req, res) {
  
   res.sendFile(path.join(viewPath, '/index.html'));
})
app.get('/', function (req, res) {
  
   res.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
})

// app.get('/compare', function (req, res) {
//   console.log('---in compare---');
//   //console.log(req);
//   res.sendFile(path.join(viewPath, 'compare.html'));
// })

//to authenticate the org
app.post("/CS", function (req, res) {
  console.log("req.body: " );
  console.log( req.body);
  sf_data.authenticate(req,res);

 });

//to fetch the permission set metadata
app.post("/fetchPermissionSetMeta", function (req, res) {
  console.log("req.body: " );
  console.log( req.body);
  sf_data.fetchPermissionSetMeta(req,res);

 });
//retrieve custom setting meta
app.post("/customsettingmeta", function (req, res) {
  console.log("req.body: " );
  console.log( req.body);
  sf_data.fetchCustomSettingtMeta(req,res);

 });
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(port, function() {
   //var host = server.address().address
   //var port = server.address().port
   console.log("Example app listening at');
   

})

module.exports = app;
