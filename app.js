var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon')
const session = require('express-session');
const FileStore = require('session-file-store')(session);

var app = express();
var http = require ( 'http' ) .createServer (app); 
var io = require ( 'socket.io' ) (http);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico'),{maxAge:2592000000}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'woobins word',
  resave: false , 
  saveUninitialized : true , 
  store : new FileStore()
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 채팅기능 구현 연습
io.on('connection', (socket) => {
  console.log('유저가 연결됨 : ' , socket.id);
  socket.emit('user',socket.id);

  socket.on('disconnect',() => {
    console.log('유저가 연결 해제됨 : ',socket.id);
  });

  socket.on('send message', (text) => {
    console.log(text);
    socket.broadcast.emit('answer', { name:socket.id , msg : text});
    text = '';
  })
})

http.listen ( 3000 , () => { console .log ( 'listening on * : 3000' ); });
module.exports = app;
