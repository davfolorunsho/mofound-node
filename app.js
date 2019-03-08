var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
var mustacheExpress = require('mustache-express');
var engine = mustacheExpress();

var indexRouter = require('./routes/main');
var apiRouter = require('./routes/api/index');
var adminRouter = require('./routes/admin/admin');
// const bcrypt = require('bcrypt'); 

require('./model/admin');
require('./config/passport');
var app = express();

// Configure Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ 
    secret: 'mofound-session', 
    cookie: { minxAge: 6000000 }, 
    resave: true, 
    saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('flash')());

// app.use(function(req, res){
//     req.flash('info', 'hello!');
//     next();
// })

app.engine('mst', mustacheExpress());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'mst');
// app.set('views', __dirname + '/views');
app.set('views', path.join(__dirname, 'views'));

// Set up mongoose connection
// var mongoDB = 'mongodb://localhost:27017/mofounddb';
var mongoDB = "mongodb://admin:mofound2admin@ds115244.mlab.com:15244/mofounddb"
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.on('error', console.log('Error Connecting to Database'));


app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

app.use(function(err, req, res, next) {
    console.error(err.message);
    if (!err.status) err.status = 500;
    res.status(err.status).send(err.message);
    res.render('error');
  })

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    
    var err = new Error('Something went wrong or the resource you want to access in not found.');
    err.status = 404;
    next(err);
  });
  
  // // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    console.error("#Error", err.message);
    res.status(err.status || 500);
    // res.render('error');
    res.redirect('/error');
  }); 

  // app.use(function(err, req, res, next) {
  //   console.error(err.message);

  //   if (!err.statusCode) err.statusCode = 500;
  //   res.status(err.statusCode).send(err.message);
  //   res.render('error');
  // })

module.exports = app;
