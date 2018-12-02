var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
// var {MongoClient} = require("mongodb");

var mustacheExpress = require('mustache-express');
// var mustache = require('mustache');
var engine = mustacheExpress();
var cache = engine.cache; // Caches the full file name with some internal data.


var indexRouter = require('./routes/main');
var usersRouter = require('./routes/main/users');
var apiRouter = require('./routes/api/index');
var adminRouter = require('./routes/admin/admin');


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
    cookie: { maxAge: 60000 }, 
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

app.set('view engine', 'mst');
app.set('views', __dirname + '/views');
// app.set('partials', __dirname + '/views/partials');
// app.engine('mst', mustache(__dirname + 'views/partials', '.mst'));
app.use(express.static(path.join(__dirname, 'public')));

// Catch 404 forward to error handler
// app.use((req, res, next)=>{
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// Set up mongoose connection
var mongoDB = 'mongodb://localhost:27017/mofounddb';
// var mongoDB = "mongodb://admin:mofound2admin@ds115244.mlab.com:15244/mofounddb"
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
// mongoose.connect(mongoDB, { useNewUrlParser: true })
// var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.on('error', console.log('Error Connecting to Database'));

// Error handler

app.use((err, req, res, next)=>{
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err: {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);
app.use('admin', adminRouter);

module.exports = app;
