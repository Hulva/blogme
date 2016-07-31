/**
 * Created by Hulva on 2016/2/10.
 * 评论相关
 */
var utility = require('utility');
var Dao = require('../dao');
var config = require('../config/config');
var log = require('../common/logger').getLogger('console');

exports.addComment = function (req, res, next) {
    // 判断评论是否来自游客
    if (req.body.name) {
        var _name = req.body.name == "anonymous" ? req.body.name : "anonymous_" + req.body.name
        var url
        if (req.body.email) {
            url = ('https://gravatar.com/avatar/' + utility.md5(req.body.email.toLowerCase()) + '?size=48')
        } else {
            url = config.avatar_image_url
        }
        var anonymous = {
            name: _name
            , avatar_image_url: url
            , commenter_url: '/'
        };
        Dao.Comment.newAndSave(anonymous, req.body.title, req.params.articleId, req.body.content, function (err, comment) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            Dao.Post.updateCommentCount(req.params.articleId, function (err, post) {
                console.log('留言数量更新成功！')
            });
            req.flash('success', '留言成功！');
            res.redirect('back');
        });
    } else {
        Dao.Comment.newAndSave(req.session.user, req.body.title, req.params.articleId, req.body.content, function (err, comment) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            Dao.Post.updateCommentCount(req.params.articleId, function (err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                console.log('留言数量更新成功！')
                req.flash('success', '留言成功！');
                res.redirect('back');
            })

        })
    }
}