/**
 * Created by Hulva on 2016/2/8
 * 配置文件.
 */
var path = require('path')

var config = {
    // debug为true时，用于本地调试
    local: true,

    // SEO
    description: ''
    , keywords: '',

    site_logo: ''
    , site_icon: '',

    // admin可删除任意博客，可删除用户
    admins: ['hulva', 'hello'],

    port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000,

    ip_address: process.env.OPENSHIFT_NODEJS_IP || 'localhost',

    // 默认用户头像（如果游客进行评论时没有填写邮箱，起头像默认也是这个）
    avatar_image_url: '/images/userHeads/default.jpg',

    // 每页最多展示的文章数
    list_post_count: 5,

    list_user_count: 5,

    // 每页展示的标签数
    list_tag_count: 20,

    //baseUrl: 'http://localhost:8080'
// '115.29.138.65'
}

module.exports = config
