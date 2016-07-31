/**
 * 用户相关
 * Created by Hulva on 2016/2/9.
 */
var Dao = require('../dao');
var config = require('../config/config');

exports.index = function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    Dao.User.getUserByName(req.params.name, function (err, _user) {
        if (!_user) {
            req.flash('error', '没有这个用户！');
            return res.redirect(req.session._loginReferer || '/');
        }
        Dao.Post.getPostsByQuery({
            author: _user.name
            , isOriginal: true
        },page, config.list_post_count, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect(req.session._loginReferer || '/');
            }
            res.render('user', {
                title: _user.name
                , posts: posts
                , page: page
                , isFirstPage: (page - 1) == 0
                , isLastPage: ((page - 1) * 10 + posts.length)
                , user: _user
                , success: req.flash('success').toString()
                , error: req.flash('error').toString()
            });
        });
    });
};
