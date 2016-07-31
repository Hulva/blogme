var models = require('../models');
var Comment = models.Comment;
var tools = require('../common/tools');

/**
 * 根据评论id删除评论
 * @param commentId
 * @param callback
 */
exports.removeComment = function (commentId, callback) {
  Comment.findOne({_id: commentId}, function (err, comment) {
      if (err){
          return callback(err);
      }
      comment.remove();
      return callback(null);
  });
};

/**
 * 根据文章id获取评论
 * @param article_id
 * @param callback
 */
exports.getCommentsByArticleId = function (article_id, callback) {
    Comment.find({
        article_id: article_id
    }, '', {
        sort: '-create_at'
    }, function (err, comments) {
        if (err) {
            return callback(err);
        }
        if (comments.length === 0) {
            return callback(null, []);
        }
        return callback(null, comments);
    });
};

/**
 *  根据条件获取评论数据（带分页和设定记录数）
 * @param query 查询条件
 * @param page 当前页
 * @param count 每页显示的记录数
 * @param callback 回调函数
 */
exports.getCommentsByCondition = function (query, page, count, callback) {
    // 使用count 返会特定查询的文档数 total
    Comment.count(query, function (err, total) {
        Comment.find(query, null, {
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
 * 创建并保存一条评论
 */
exports.newAndSave = function (user, _title, article_id, content, callback) {
    var comment = new Comment();

    comment.content = content;
    comment.name = user.name;
    comment.title = _title;
    comment.article_id = article_id;
    comment.head_image_url = user.avatar_image_url;
    comment.commenter_url = "/user/" + user.name;

    comment.save(function (err) {
        callback(err, comment);
    });
};