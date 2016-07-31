var logger = require('log4js');
logger.configure({
    appenders: [

        {
            type: "console"
            , category: "console"
            , level: "INFO"
        }

        , {
            type: "dateFile"
            , filename: "log/access.log"
            , pattern: "-yyyy-MM-dd"
            , category: "http"
        }

        , {
            type: "file"
            , filename: "log/blogme.log"
            , maxLogSize: 1024
            , numBackups: 8
            , category: 'hulva'
        }

        , {
            type: "logLevelFilter"
            , level: "ERROR"
            , appender: {
                type: "file"
                , filename: "log/errors.log"
            }
        }
    ]
});

module.exports = logger;
