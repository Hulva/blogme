var models = require('../models');
var User = models.User;

/**
 *  根据用户id删除用户数据
 * @param id
 * @param callback
 */
exports.removeUser = function (id, callback) {
    User.findOne({_id: id},function (err, user) {
        if (err){
            return callback(err);
        }
        user.remove();
        return callback(null);
    });
};

/**
 * 获取指定数量的用户数据
 * @param count
 * @param page
 * @param callback
 */
exports.getUsersWithCount = function (query ,count, page, callback) {
    User.count(query, function (err, total) {
        User.find(query, null, {
            skip: (page - 1) * count
            , limit: count
            , sort: '-create_at'
        }, function (err, users) {
            if (err) {
                return callback(err);
            }
            callback(null, users, total);
        });
    });
};

/**
 *  更新用户状态
 * @param user_id 用户id
 * @param isBlock 是否锁定
 * @param callback
 */
exports.updateUser = function (user_id, isBlock, callback) {
    var bool;
    if (isBlock == 'false') {
        bool = true;
    } else {
        bool = false;
    }
    User.update({
        _id: user_id
    }, {
        $set: {
            is_block: bool
        }
    }, function (err) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
};


/**
 * 根据用户名查找用户
 * @param name 用户名
 * @param callback
 * @returns {*}
 */
exports.getUserByName = function (name, callback) {
    if (name.length == 0) {
        return callback(null, []);
    }
    User.findOne({
        name: name
    }, callback);
};

/**
 * 根据邮箱，查找用户
 * @param email 邮箱
 * @param callback
 */
exports.getUserByMail = function (email, callback) {
    User.findOne({
        email: email
    }, callback);
};

/**
 * 获取全部用户
 * @param callback
 */
exports.getUsers = function (callback) {
    User.find();
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query, opt, callback) {
    User.find(query, '', opt, callback);
};

/**
 * 新建一条用户数据
 * @param name 用户名
 * @param pass 密码
 * @param email 邮箱
 * @param avatar_url 头像地址
 * @param isAdmin 是否是管理员
 * @param callback 回调函数
 */
exports.newAndSave = function (name, pass, email, avatar_url, isAdmin, callback) {
    var user = new User();
    user.name = name;
    user.password = pass;
    user.email = email;
    user.avatar_image_url = avatar_url;
    user.isAdmin = isAdmin;

    user.save(function (err) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, user);
    });
};
