/**
 * 连接到mongodb
 * 使用mongoose而非mongodb中间件
 **/
var mongoose = require('mongoose');
var host, port, username, password, database, url;

if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    host = process.env.OPENSHIFT_MONGODB_DB_HOST;
    username = process.env.OPENSHIFT_MONGODB_DB_USERNAME,
        password = process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
        database = process.env.OPENSHIFT_APP_NAME;
    port = process.env.OPENSHIFT_MONGODB_DB_PORT;
    url = "mongodb://" + username + ":" + password + "@" + host + ":" + port + "/" + database;
} else {
    host = '127.0.0.1';
    database = 'blogme';
    port = 27017;
    url = "mongodb://127.0.0.1:27017/blogme";
}


var recon = true;
function getConnect() {
    var opts = {
        db: { native_parser: true },
        server: { poolSize: 10, auto_reconnect: true },
        user: username,
        pass: password
    };
    mongoose.connect(url, opts);
    //var dbcon = mongoose.connection;
    var dbcon = mongoose.createConnection(url, opts);
    dbcon.on('error', function (error) {
        console.log('connection error');
        // throw new Error('disconnected,restart');
        dbcon.close();
    });

    //监听关闭事件并重连
    dbcon.on('disconnected', function () {
        console.log('disconnected');
        dbcon.close();
    });
    dbcon.on('open', function () {
        console.log('connection success open');
        recon = true;
    });
    dbcon.on('close', function (err) {
        console.log('closed');
        // dbcon.open(host, dbName, port, opts, function() {
        // console.log('closed-opening');
        // });
        reConnect('*');
    });
    function reConnect(msg) {
        console.log('reConnect' + msg);
        if (recon) {
            console.log('reConnect-**');
            dbcon.open(host, database, port, opts, function () {
                console.log('closed-opening');
            });
            recon = false;
            console.log('reConnect-***');
        }
        ;
        console.log('reConnect-end');
    }
}

exports.getConnect = getConnect; 
exports.mongoose = mongoose;  
