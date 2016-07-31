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

/**
 * 后台系统首页
 */
exports.showAdmin = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        res.render('admin/index', {
            title: 'BlogMe后台管理页面'
            , admin: req.session.user
        });
    } else {
        return res.redirect('/');
    }
};

/**
 * 用户管理页数据
 */
exports.showUsers = function (req, res, next) {
    var query = {};
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = req.query.p ? parseInt(req.query.p) : 1;
        var count;
        if (req.query.c) {
            count = c;
        } else {
            count = config.list_user_count;
        }
        Dao.User.getUsersWithCount(query, count, page, function (err, users, total) {
            if (err) {
                users = [];
            }
            res.render('admin/users', {
                title: ''
                , users: users
                , admin: req.session.user
                , page: page
                , total: total
                , isFirstPage: (page - 1) == 0
                , isLastPage: ((page - 1) * count + users.length) == total
            });
        });
    } else {
        return res.redirect('/');
    }
};

/**
 * 用户检索
 */
exports.userSearch = function (req, res, next) {
    var query = {};
    if (req.query.search) {
        query['name'] = new RegExp(req.query.search);//模糊查询参数
    }
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.User.getUsersWithCount(query, config.list_user_count, page, function (err, users, total) {
        if (err) {
            users = [];
        }
        res.render('admin/users', {
            title: req.query.search
            , users: users
            , admin: req.session.user
            , page: page
            , total: total
            , isFirstPage: (page - 1) == 0
            , isLastPage: ((page - 1) * 10 + users.length) == total
        });
    });
};

/**
 * 文章管理页数据
 */
exports.showPosts = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = req.query.p ? parseInt(req.query.p) : 1;
        var count;
        if (req.query.c) {
            count = req.query.c;
        } else {
            count = config.list_post_count;
        }

        Dao.Post.getPostsByQuery(null, page, count, function (err, posts, total) {
            res.render('admin/posts', {
                title: '',
                posts: posts
                , admin: req.session.user
                , page: page
                , total: total
                , isFirstPage: (page - 1) == 0
                , isLastPage: ((page - 1) * count + posts.length) == total
            });
        });
    } else {
        return res.redirect('/');
    }
};

/**
 * 文章检索
 */
exports.postSearch = function (req, res, next) {
    var query = {};
    if (req.query.search) {
        query['title'] = new RegExp(req.query.search);//模糊查询参数
    }
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.Post.getPostsByQuery(query, page, config.list_user_count, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('admin/posts', {
            title: req.query.search
            , posts: posts
            , admin: req.session.user
            , page: page
            , total: total
            , isFirstPage: (page - 1) == 0
            , isLastPage: ((page - 1) * 10 + posts.length) == total
        });
    });
};

/**
 * 删除文章
 */
exports.deletePost = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        var post_id = req.body.ids.split(',');
        for (var i = 0; i < post_id.length; i++) {
            // 删除评论
            Dao.Comment.getCommentsByArticleId(post_id[i], function (err, comment) {
                // log.info("comment: ",comment)
                for (var i = 0; i < comment.length; i++) {
                    comment[i].remove();
                }
            });
            // 删除文章
            Dao.Post.removePost(post_id[i], function (err) {
                if (err) {
                    log.error('删除失败：', err);
                    req.flash('error', err);
                    return res.redirect('back');
                }
                return res.redirect('admin/posts');
            });
        }
    } else {
        return res.redirect('/');
    }
};

/**
 * 删除用户（批量）
 * TODO
 */
exports.deleteUser = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        // log.info(req.body);
        var user_id = req.body.ids.split(',');
        for (var i = 0; i < user_id.length; i++) {
            if (user_id[i] !== '') {
                Dao.Post.getPostsByQuery({user_id: user_id[i]}, null, function (err, posts) {
                    // log.info("posts:",posts)
                    // 删除在该用户名下的所有文章
                    for (var i = 0; i < posts.length; i++) {
                        // 删除每篇文章下的评论
                        Dao.Comment.getCommentsByArticleId(posts[i]._id, function (err, comment) {
                            // log.info("comment: ",comment)
                            for (var i = 0; i < comment.length; i++) {
                                comment[i].remove();
                            }
                        });
                        posts[i].remove();
                    }
                });
                Dao.User.removeUser(user_id[i], function (err) {
                    // log.info("deleteUserError:",err);
                    if (err) {
                        req.flash('error', err);
                        return res.redirect('back');
                    }
                });
            }
        }
        return res.redirect('/admin/users');
    } else {
        return res.redirect('/');
    }
};

/**
 * 更新用户状态（锁定/解锁）
 */
exports.block = function (req, res, next) {
    // log.info("req.session.user:",req.session.user);
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        //log.info("req.params:",req.query);
        Dao.User.updateUser(req.query.userId, req.query.isBlock, function (err) {
            if (err) {
                log.error("blockError:", err);
                return res.redirect('back')
            }
            return res.redirect('/admin/users');
        })
    } else {
        return res.redirect('/');
    }
};


/**
 * 浏览显示图片文件
 * @param req
 * @param res
 * @param next
 */
exports.gallery = function (req, res, next) {
    fs.readdir("../upload", function (err, list) {
        // log.info("gallery:", list);
        if (err) {
            log.error("GalleryError:", err);
            res.render('admin/gallery', {
                gallery: [],
                error: '请稍候重试！'
            });
        }
        if (list.length == 0) {
            res.render('admin/gallery', {
                gallery: list,
                error: '并没有照片！'
            });
        } else {
            res.render('admin/gallery', {
                gallery: list
            });
        }
    });
};

/**
 * 评论管理页
 */
exports.showComments = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = req.query.p ? parseInt(req.query.p) : 1;
        var count;
        if (req.query.c) {
            count = req.query.c;
        } else {
            count = config.list_post_count;
        }

        Dao.Comment.getCommentsByCondition(null, page, count, function (err, comments, total) {
            res.render('admin/comments', {
                title: '',
                comments: comments
                , admin: req.session.user
                , page: page
                , total: total
                , isFirstPage: (page - 1) == 0
                , isLastPage: ((page - 1) * count + comments.length) == total
            });
        });
    } else {
        return res.redirect('/');
    }
};

/**
 * 评论检索
 */
exports.commentSearch = function (req, res, next) {
    var query = {};
    if (req.query.search) {
        query['content'] = new RegExp(req.query.search);//模糊查询参数
    }
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Dao.Comment.getCommentsByCondition(query, page, config.list_user_count, function (err, comments, total) {
        if (err) {
            comments = [];
        }
        res.render('admin/comments', {
            title: req.query.search
            , comments: comments
            , admin: req.session.user
            , page: page
            , total: total
            , isFirstPage: (page - 1) == 0
            , isLastPage: ((page - 1) * 10 + comments.length) == total
        });
    });
};

exports.deleteComment = function (req, res, next) {
    //页面权限控制
    if (req.session.user && req.session.user.isAdmin) {
        // log.info(req.body);
        var comment_id = req.body.ids.split(',');
        for (var i = 0; i < comment_id.length; i++) {
            if (comment_id[i] !== '') {
                // 删除每篇文章下的评论
                Dao.Comment.removeComment(comment_id[i], function (err) {
                   if (err){
                       log.error("deleteCommentError:", err);
                   }
                });
            }
        }
        return res.redirect('/admin/comments');
    } else {
        return res.redirect('/');
    }
};
