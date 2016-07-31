var express = require('express');
var router = express.Router();
var blogme = require('../controller/blogme');
var post = require('../controller/post');
var user = require('../controller/user');
var comment = require('../controller/comment');
var admin = require('../controller/admin');

// 首页
router.get('/', blogme.index);

// 管理员页面
router.get('/admin', admin.showAdmin);
// 用户列表
router.get('/admin/users', admin.showUsers);
// 文章列表
router.get('/admin/posts', admin.showPosts);
// 评论列表
router.get('/admin/comments', admin.showComments);
// 删除文章
router.post('/admin/posts/delete', admin.deletePost);
// 删除用户
router.post('/admin/users/delete', admin.deleteUser);
// 删除怕评论
router.post('/admin/comments/delete', admin.deleteComment);
// 更改用户状态
router.get('/admin/users/block', admin.block);
// 相册
router.get('/gallery', admin.gallery);
// 检索用户
router.get('/searchUser', admin.userSearch);
// 检索文章
router.get('/searchPosts', admin.postSearch);
// 检索评论
router.get('/searchComment', admin.commentSearch);

//注册页
router.get('/signup', blogme.showSignup);
//提交注册信息
router.post('/signup', blogme.signup);

//登录页
router.get('/signin', blogme.showSignin);
// 提交登录数据
router.post('/signin', blogme.signin);

// 登出
router.get('/signout', blogme.signOut);

// 搜索
router.get('/search', blogme.mySearch);

// 创建文章页
router.get('/post', post.createPost);
// 提交文章数据
router.post('/post', post.putPost);
// 显示编辑文章页
router.get('/edit/:name/:articleId', post.editPost);
// 提交修改文章数据
router.post('/edit/:name/:articleId', post.updatePost);
// 删除文章
router.get('/remove/:name/:articleId', post.deletePost);

// 用户个人主页
router.get('/user/:name', user.index);
// 文章详情页
router.get('/user/:name/:articleId', post.showPost);

// 上传
router.get('/upload', blogme.showUpload);
router.post('/upload', blogme.doUpload);

// Archive
router.get('/archive', blogme.showArchive);

// 标签
router.get('/tags', blogme.showTags);
// 标签对应的文章
router.get('/tags/:tag', blogme.showArticlesWithTag);

// 提交评论
router.post('/user/:name/:articleId', comment.addComment);

// 转载
router.get('/reprint/:author/:articleId', post.reprint);

// 关于
router.get('/about', blogme.about);

// 其他任意路径均转至主页
router.get('/*', blogme.toIndex);

module.exports = router;
