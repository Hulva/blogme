var express = require('express');
var engine = require('ejs-mate');
var path = require('path');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var fs = require('fs');
var db = require('./db.js')

//flash模块实现页面通知功能（即成功与错误信息的显示）
var flash = require('connect-flash');
var favicon = require('serve-favicon');
//var logger = require('morgan');replaced by log4js

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ueditor = require("ueditor");

var log = require('./common/logger').getLogger('file');

var routes = require('./routes/index');

var app = express();

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// replace this with the log4j connect-logger
//app.use(logger('dev'));
app.use(require('./common/logger').connectLogger(require('./common/logger').getLogger("http"), {
    level: 'auto'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// //添加对上传文件的支持(保留上传文件的后缀名，设置上传目录为/public/images)
/*app.use(bodyParser({
 keepExtensions: true
 , uploadDir: './public/upload'
 }));*/

//cookie解析的中间件
app.use(cookieParser());
// 静态文件存放目录
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());


//提供session支持
app.use(session({
    secret: 'blogme'
    , key: 'blogme_cookie', //cookie name
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }, //一天
    resave: false
    , saveUninitialized: true
    , store: new MongoStore({
        mongooseConnection: db.mongoose.connection
    })
}));

app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
    // ueditor 客户发起上传图片请求
    if (req.query.action === 'uploadimage') {
        //var foo = req.ueditor;

        var img_url = '/images/upload/';
        // 保存上传的图像的信息到数据库

        res.ue_up(img_url); //输入要保存的地址 。保存操作交给ueditor来做
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = '/images/upload/';
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}));


app.use('/', routes);
//将路由控制和实现路由功能全部放到routes/index.js中

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        log.error("Something went wrong:", err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message
            , error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    log.error("Something went wrong:", err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message
        , error: err
    });
});

module.exports = app;
