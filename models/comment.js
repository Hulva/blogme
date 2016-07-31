var mongoose = require('mongoose');
var BaseModel = require('./base_model');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    article_id: {type: String}, // 文章id
    name: {type: String}, // 发表评论的人的用户名
    title: {type: String}, // 评论的博文标题
    head_image_url: {type: String},// 发表评论的人的头像
    commenter_url: {type: String}, // 评论人主页地址
    content: {type: String}, // 评论内容
    create_at: {type: Date, default: Date.now}, // 评论发表时间
    update_at: {type: Date, default: Date.now}, // 评论修改时间
}, {
    collection: 'comments'
});

CommentSchema.plugin(BaseModel);

mongoose.model('Comment', CommentSchema);
