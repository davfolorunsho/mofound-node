var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mustacheExpress = require('mustache-express');
// var mustache = require('mustache');
var engine = mustacheExpress();
var cache = engine.cache; // Caches the full file name with some internal data.


var indexRouter = require('./routes/main');
var usersRouter = require('./routes/main/users');
var apiRouter = require('./routes/api/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.engine('mst', mustacheExpress());

app.set('view engine', 'mst');
app.set('views', __dirname + '/views');
// app.set('partials', __dirname + '/views/partials');
// app.engine('mst', mustache(__dirname + 'views/partials', '.mst'));
app.use(express.static(path.join(__dirname, 'public')));

// Catch 404 forward to error handler
app.use((req, res, next)=>{
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

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

module.exports = app;
