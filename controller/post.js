/**
 * Created by Hulva on 2016/2/9.
 * 博文相关
 */

// 博文页

var Dao = require('../dao')

var eventproxy = require('eventproxy');
var log = require('../common/logger').getLogger('console');

// 博文编辑页
exports.createPost = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        res.redirect(req.session._loginReferer || '/')
        return;
    }
    res.render('post', {
        title: '发表'
        , user: req.session.user
        , success: req.flash('success').toString()
        , error: req.flash('error').toString()
    });
}

// 博文内容提交
exports.putPost = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        return res.redirect('sign/signin');
    }
    var user = req.session.user
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3]
    var title = req.body.title
    var content = req.body.post
    //console.log(username+'\n tags:'+tags+'\ntitle:'+title+'\n content:'+content)
    // 验证
    var editError;
    if (title == '') {
        editError = '标题不能为空！'
    } else if (content == '') {
        editError = '内容不能为空！'
    }
    if (editError) {
        return res.render('post', {
            edit_error: editError
            , title: title
            , content: content
            , tags: tags
        });
    }
    Dao.Post.newAndSave(title, content, tags, user, null, function (err, post) {
        //log.info("post:",post);
        if (err) {
            log.error("saveArticleError:", err);
            return next(err);
        }
        post.original_url = '/user/' + user.name + "/" + post._id;
        post.save();

        var ep = new eventproxy();

        ep.all('post_saved', function () {
            res.redirect('/');
        });
        ep.fail(next);
        Dao.User.getUserByName(user.name, function (err, getUser) {
            getUser.post_count += 1;
            getUser.save();
            ep.emit('post_saved');
        });
    });
};

// 博文详情页
exports.showPost = function (req, res, next) {
    Dao.Post.getPost(req.params.articleId, function (err, _post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        // log.info("showPost:", _post);
        if (_post.length == 0) {
            return res.redirect('/');
        }
        _post.visit_count += 1;
        _post.save(function (err) {
            if (err) {
                log.error("update visitCount failure:", err);
            }
        });
        /*        Dao.Post.updateVisitCount(req.params.title, req.params.name, function (err) {
         if (err) {
         log.error("update visitCount failure:", err);
         }
         })*/
        Dao.Comment.getCommentsByCondition({article_id: req.params.articleId}, 1, 5, function (err, _comments, total) {
            //console.log(_comments)
            return res.render('article', {
                title: req.params.title
                , post: _post
                , user: req.session.user
                , comments: _comments
                , isLastPage: _comments.length == total
            });
        });
    });
};


// 文章编辑
exports.editPost = function (req, res, next) {
    req.session._postReferer = req.headers.referer;
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        return res.redirect('sign/signin');
    }
    var currentUser = req.session.user;
    Dao.Post.getPost(req.params.articleId, function (err, post) {
        if (err) {
            return res.render('404', {
                error: err
            });
        }
        return res.render('edit', {
            title: '编辑',
            post: post,
            user: currentUser
        });
    });
};

exports.updatePost = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        return res.redirect('sign/signin');
    }
    if (req.session.user.name !== req.params.name) {
        req.flash('error', '您没有更新这篇文章的权限！')
        return res.redirect('error');
    }
    Dao.Post.updateContent(req.params.articleId, req.body.content, function (err) {
        if (err) {
            return res.render('article', {
                title: req.params.title,
                post: req.body.content,
                user: req.session.user,
                error: '更新文章失败！'
            });
        }
        var url = '/user/' + req.params.name + '/' + req.params.articleId;
        return res.redirect(url);
    })
}


// 删除文章
exports.deletePost = function (req, res, next) {
    //页面权限控制
    if (!req.session.user) {
        req.flash('error', '未登陆！');
        return res.redirect('sign/signin');
    }
    if (req.session.user.name !== req.params.name) {
        req.flash('error', '您没有删除这篇文章的权限！');
        return res.redirect('back');
    }
    Dao.Comment.getCommentsByArticleId(req.params.articleId, function (err, comment) {
        console.log(comment)
        for (var i = 0; i < comment.length; i++) {
            comment[i].remove();
        }
    });
    Dao.Post.removePost(req.params.articleId, function (err, post) {
        if (err) {
            //log.info('删除失败：', err)
            req.flash('error', err);
            return res.redirect('back');
        }
        //log.info("被删除的文章：", post);
        req.flash('success', '删除成功！');
        return res.redirect('/');
    })
}

// 文章转载
exports.reprint = function (req, res, next) {
    Dao.Post.getPost(req.params.articleId, function (err, post) {
        if (err) {
            log.error('reprintError:', err);
            req.flash('error', err);
            return res.redirect('back');
        }
        Dao.Post.newAndSave(post.title, post.content, post.tags, req.session.user, post, function (err) {
            if (err) {
                log.error("reprintError:", err);
                return next(err);
            }
            var ep = new eventproxy();
            ep.all('post_reprinted', function () {
                res.redirect('/');
            })
            ep.fail(next);
            // 原文章被转载数+1
            post.reprint_count += 1;
            post.save();
            // 当前用户发表文章数+1
            Dao.User.getUserByName(req.session.user.name, function (err, getUser) {
                if (err) {
                    log.error("updatePostCountError:", err);
                    return res.redirect('back');
                }
                getUser.post_count += 1;
                getUser.save();
                ep.emit('post_reprinted');
            });
        });
    });
};