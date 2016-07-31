var mongoose = require('mongoose');
var BaseModel = require('./base_model');
var Schema = mongoose.Schema;

var PostSchema = new Schema({
    user_id: {type: String}, // 用户id
    title: {type: String}, // 文章标题
    content: {type: String}, // 文章内容
    tags: {type: [String]}, // 标签
    author: {type: String}, // 作者
    visit_count: {type: Number, default: 0}, // 访问数
    comment_count: {type: Number, default: 0}, // 评论数
    create_at: {type: Date, default: Date.now}, // 发表时间
    update_at: {type: Date, default: Date.now}, // 更新时间
    isOriginal: {type: Boolean, default: true}, // 原创还是转载
    original_url: {type: String}, // 原文地址
    isDraft: {type: Boolean}, // 是否是草稿
    reprint_count: {type: Number, default: 0} // 转载次数
}, {
    collection: 'posts'
});

PostSchema.plugin(BaseModel);

mongoose.model('Post', PostSchema);
