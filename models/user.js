var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {
        type: String
        , unique: true
    }, // 用户名
    password: {
        type: String
    }, // 密码
    email: {
        type: String
        , unique: true
    }, // 邮箱
    avatar_image_url: {
        type: String
    }, // 用户头像地址
    signature: {
        type: String
        , default: ""
    }, // 签名
    is_block: {
        type: Boolean
        , default: false
    }, // 账户是否被锁定
    post_count: {
        type: Number
        , default: 0
    }, // 文章数量
    /*  follower_count: {
     type: Number
     , default: 0
     }, // 被关注数
     following_count: {
     type: Number
     , default: 0
     }, // 关注数*/
    create_at: {
        type: Date
        , default: Date.now
    }, // 账户创建时间
    isAdmin: {
        type: Boolean
        , default: false
    } // 访问权限
}, {
    collection: 'users'
});

UserSchema.plugin(BaseModel);

mongoose.model('User', UserSchema);