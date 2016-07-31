var models = require('../models');
var Post = models.Post;
var tools = require('../common/tools');
var markdown = require('markdown').markdown;
var log = require('../common/logger').getLogger('console');

/**
 * 拿到指定数量（count）的文章
 * @param query 查询条件
 * @param page 当前页
 * @param count 每页显示的文章数量
 * @param callback 回调函数
 */
exports.getPostsByQuery = function (query, page, count, callback) {
    Post.count(query, function (err, total) {
        Post.find(query, null, {
            skip: (page - 1) * count
            , limit: count
            , sort: '-create_at'
        }, function (err, docs) {
            if (err) {
                return callback(err);
            }
            callback(null, docs, total);
        });
    });
};


/**
 * 根据文章id获取文章
 * @param article_id 文章id
 * @param callback 回调函数
 */
exports.getPost = function (article_id, callback) {
    Post.findOne({
        _id: article_id
    }, function (err, post) {
        if (err || !post) {
            // 如果出错，将错误信息输出到日志文件
            log.error("getPostError:", err);
            return callback(err, []);
        }
        return callback(null, post);
    });
};

/**
 * 更新评论次数
 * @param title
 * @param name
 * @param callback
 */
exports.updateCommentCount = function (articleId, callback) {
    Post.findOne({
        _id: articleId
    }, function (err, post) {
        if (err || !post) {
            return callback(err);
        }
        post.comment_count += 1;
        post.save(callback);
    });
};

/**
 * 更新访问次数
 * */
exports.updateVisitCount = function (articleId, callback) {
    Post.findOne({
        _id: articleId
    }, function (err, post) {
        if (err || !post) {
            return callback(err);
        }
        post.visit_count += 1;
        post.save(callback);
    });
};

/**
 * 更新文章内容
 * */
exports.updateContent = function (articleId, _content, callback) {
    Post.findOne({
        _id: articleId
    }, function (err, post) {
        if (err || !post) {
            return callback(err);
        }
        post.update_at = new Date();
        post.content = _content;
        post.save(callback);
    });
};

/**
 * 拿到所有的标签
 * @param callback
 */
exports.getAllTags = function (callback) {
    Post.distinct('tags', function (err, tags) {
        if (err) {
            return callback(err);
        }
        callback(null, tags)
    });
};

/**
 * 根据文章id删除文章
 * @param article_id
 * @param callback
 */
exports.removePost = function (article_id, callback) {
    Post.findOne({_id: article_id},function (err, post) {
        if (err){
            log.error("removePostError:", err);
            callback(err);
        }else {
            post.remove();
            callback(null);
        }
    });
};

/**
 * 新建一条文章记录
 * @param title 文章标题
 * @param content 文章内容
 * @param tags 标签
 * @param user 创建者
 * @param originalPost 原文（供转载使用）
 * @param callback 回调函数
 */
exports.newAndSave = function (title, content, tags, user, originalPost, callback) {
    var post = new Post();

    post.content = content;
    post.tags = tags;
    post.user_id = user._id;
    post.author = user.name;
    if (originalPost) { // 转载判断
        if (originalPost.isOriginal){ // 转载文章是否为原创文章
            post.title = '[转载]' + title;
        }else {
            post.title = originalPost.title;
        }
        post.isOriginal = false;

        post.original_url = originalPost.original_url;
    } else {
        post.title = title;
        post.isOriginal = true;
    }
    post.save(callback);
};
