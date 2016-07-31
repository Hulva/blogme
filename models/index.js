var db = require('../db.js');
db.getConnect();

require('./user');
require('./post');
require('./comment');

exports.User = db.mongoose.model('User');
exports.Post = db.mongoose.model('Post');
exports.Comment = db.mongoose.model('Comment');
