/**
 * Created by Hulva on 2016/2/1.
 * 站点相关
 */
var eventproxy = require('eventproxy');
var validator = require('validator');
var Dao = require('../dao');
var tools = require('../common/tools');
var config = require('../config/config');
var utility = require('utility');

var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');

var log = require('../common/logger').getLogger('console');


exports.toIndex = function (req, res, next) {
    res.redirect('/');
};


/**
 * 主页
 * @param req
 * @param res
 * @param next
 */
exports.index = function (req, res, next) {
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    if (page === 1){
        Dao.Post.getPostsByQuery(null, page, config.list_post_count, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页'
                , posts: posts
                , user: req.session.user
                , page: page
                , isFirstPage: (page - 1) == 0
                , isLastPage: ((page - 1) * config.list_post_count + posts.length) == total
            });
        });
    }else {
        Dao.Post.getPostsByQuery(null, page, config.list_post_count, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            if (posts.length > 0){
                res.render('partials/article', {
                    title: '主页'
                    , posts: posts
                    , user: req.session.user
                    , page: page
                    , isFirstPage: (page - 1) == 0
                    , isLastPage: ((page - 1) * config.list_post_count + posts.length) == total
                });
            }else {
                res.write("");
                res.end();
            }

        });
    }

};

/**
 * 注册页
 * @param req
 * @param res
 * @param next
 */
exports.showSignup = function (req, res, next) {
    res.render('sign/signup', {
        title: '注册'
        , username: ''
        , email: ''
    });
};

/**
 * 提交注册信息
 * @param req
 * @param res
 * @param next
 */
exports.signup = function (req, res, next) {
    var username = req.body.username;
    var pwd = req.body.password;
    var rePwd = req.body.re_password;
    var email = req.body.email;

    var ep = new eventproxy();
    ep.fail(next);
    ep.on('prop_err', function (msg) {
        //req.status(422)
        res.render('sign/signup', {
            title: '注册'
            , error: msg
            , username: username
            , email: email
        });
    });

    // 注册信息验证
    if (username == '') {
        return ep.emit('prop_err', '用户名不能为空！')
    } else if (pwd == '' || rePwd == '') {
        return ep.emit('prop_err', '密码不能为空！')
    } else if (email == '') {
        return ep.emit('prop_err', '邮箱不能为空！')
    }
    if (!validator.isEmail(email)) {
        return ep.emit('prop_err', '邮箱不合法！')
    }
    if (pwd != rePwd) {
        return ep.emit('prop_err', '两次输入的密码不一致！')
    }

    Dao.User.getUsersByQuery({
        '$or': [
            {
                'name': username
            }, {
                'email': email
            }
        ]
    }, {}, function (err, users) {
        if (err) {
            return next(err);
        }
        if (users.length > 0) {
            ep.emit('prop_err', '用户名或邮箱已被使用！');
            return
        }

        tools.bhash(pwd, ep.done(function (pwdHash) {
            var url = ('https://gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48');
            Dao.User.newAndSave(username, pwdHash, email, url, false, function (err, user) {
                if (err) {
                    log.info("err", err);
                    return next(err);
                }
                log.info("user:", user);
                req.session.user = user;
                res.redirect('/');
            });
        }));
    });
};

/**
 * 登录页
 * @param req
 * @param res
 * @param next
 */
exports.showSignin = function (req, res, next) {
    req.session._loginReferer = req.headers.referer;
    console.log('refer: ' + req.headers.referer);
    res.render('sign/signin', {
        title: '登录'
        , _username: ''
    });
};

/**
 * 提交登陆数据
 * @param req
 * @param res
 * @param next
 */
exports.signin = function (req, res, next) {
    var username = req.body.username;
    var pwd = req.body.password;
    var ep = new eventproxy();

    ep.fail(next);

    if (!username) {
        return res.render('sign/signin', {
            error: '用户名不能为空！'
            , title: '登录'
            , _username: ''
        });
    } else if (!pwd) {
        return res.render('sign/signin', {
            error: '密码不能为空！'
            , title: '登录'
            , _username: req.body.username
        });
    }

    if (username.indexOf('@') != -1) {
        Dao.User.getUserByMail(username, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.render('sign/signin', {
                    error: '用户名错误！'
                    , title: '登录'
                    , _username: ''
                });
            }
            var passhash = user.pass;
            tools.bcompare(pass, passhash, ep.done(function (bool) {
                if (!bool) {
                    return res.render('sign/signin', {
                        error: '密码错误！'
                        , title: '登录'
                        , _username: req.body.username
                    });
                }
                // 判断用户是否被锁定
                if (user.is_block) {
                    return res.render('sign/signin', {
                        error: '对不起！当前用户被锁定，请联系管理员！'
                        , title: '登录'
                        , _username: req.body.username
                    });
                }
                //用户名和密码都验证完之后，见用户信息存入session
                req.session.user = user;
                // 判断数组中是否含有某元素
                Array.prototype.S = String.fromCharCode(2);
                Array.prototype.in_array = function (e) {
                    var r = new RegExp(this.S + e + this.S);
                    return (r.test(this.S + this.join(this.S) + this.S));
                };
                if (config.admins.in_array(user.name)) {
                    user.isAdmin = true;
                }
                res.redirect('/');
            }))
        })
    } else {
        Dao.User.getUserByName(username, function (err, getUser) {
            if (err) {
                return next(err);
            }
            if (!getUser) {
                return res.render('sign/signin', {
                    error: '用户名错误！'
                    , title: '登录'
                    , _username: ''
                });
            }
            var passhash = getUser.password;
            tools.bcompare(pwd, passhash, ep.done(function (bool) {
                if (!bool) {
                    return res.render('sign/signin', {
                        error: '密码错误！'
                        , title: '登录'
                        , _username: req.body.username
                    });
                }
                // 判断用户是否被锁定
                if (getUser.is_block) {
                    return res.render('sign/signin', {
                        error: '对不起！当前用户被锁定，请联系管理员！'
                        , title: '登录'
                        , _username: req.body.username
                    });
                }

                // 判断数组中是否含有某元素
                Array.prototype.S = String.fromCharCode(2);
                Array.prototype.in_array = function (e) {
                    var r = new RegExp(this.S + e + this.S);
                    return (r.test(this.S + this.join(this.S) + this.S));
                };
                if (config.admins.in_array(getUser.name)) {
                    //log.info("wawu~");
                    getUser.isAdmin = true;
                }
                //用户名和密码都验证完之后，将用户信息存入session
                req.session.user = getUser;
                res.redirect('/');
            }));
        });
    };
};

/**
 * 注销登录
 * @param req
 * @param res
 * @param next
 */
exports.signOut = function (req, res, next) {
    req.session.destroy();
    res.clearCookie('blogme_cookie', {
        path: '/'
    })
    res.redirect('/');
};

// 搜索
exports.mySearch = function (req, res, next) {
    var query = {};
    if (req.query.search) {
        query['title'] = new RegExp(req.query.search);//模糊查询参数
    }
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.Post.getPostsByQuery(query, page, config.list_post_count, function (err, posts, total) {
        if (err) {
            posts = [];
        }
       res.render('search', {
            title: req.query.search
            , posts: posts
            , user: req.session.user
            , page: page
            , isFirstPage: (page - 1) == 0
            , hasMore: ((page - 1) * 10 + posts.length) == total
        });
    });
};

//上传
exports.showUpload = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        res.redirect('/login');
        return;
    }
    res.render('upload', {
        title: '上传'
        , user: req.session.user
        , success: req.flash('success').toString()
        , error: req.flash('error').toString()
    });
};

// 提交上传
exports.doUpload = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        res.redirect('/login');
        return;
    }
    //生成multiparty对象，并配置上传目标路径
    var form = new multiparty.Form({
        uploadDir: './public/upload/'
    });
    //上传完成后处理
    form.parse(req, function (err, fields, files) {
        if (err) {
            log.error('parse error: ', err);
        } else {
            log.info('files: ', files);
            for (var key in files) {
                if (files.hasOwnProperty(key)) {
                    var inputFile = files[key];
                    var uploadedPath = inputFile[0].path;
                    var dstPath = './public/upload/' + inputFile[0].originalFilename;
                    //判断当前上传的是否为空文件
                    if ((inputFile[0].size) != 0) {
                        //重命名为真实文件名
                        fs.rename(uploadedPath, dstPath, function (err) {
                            if (err) {
                                log.error('rename error: ', err);
                            } else {
                                log.info('rename success!');
                            }
                        });
                    } else {
                        //删除空文件
                        fs.unlinkSync(uploadedPath);
                        log.info('removed an empty file!');
                    }
                }
            }
        }
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });
};

// 标签
exports.showTags = function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.Post.getAllTags(function (err, _tags) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('tags', {
            title: '标签'
            , tags: _tags
            , user: req.session.user
            , success: req.flash('success').toString()
            , error: req.flash('error').toString()
        });
    });
};

// 存档
exports.showArchive = function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.Post.getPostsByQuery(null, page, config.list_post_count, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('archive', {
            title: '存档'
            , posts: posts
            , user: req.session.user
            , page: page
            , isFirstPage: (page - 1) == 0
            , isLastPage: ((page - 1) * config.list_post_count + posts.length) == total
        });
    });
};

// 显示某标签下的文章
exports.showArticlesWithTag = function (req, res, next) {
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    var query = {};
    query.tags = req.params.tag;
    Dao.Post.getPostsByQuery(query, page, config.list_post_count, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('tag', {
            title: req.params.tag
            , posts: posts
            , user: req.session.user
            , page: page
            , isFirstPage: (page - 1) == 0
            , isLastPage: ((page - 1) * config.list_post_count + posts.length) == total
            , hasNext: false
        });
    });
};

exports.about = function (req, res, next) {
    res.render('admin/about', {});
};
