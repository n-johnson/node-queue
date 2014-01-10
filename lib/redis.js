/*!
 * nodeQueue v0.0.1 
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: redis.js 
 */

var redis = require('redis');

module.exports = function Redis() {
	console.log("Redis module initialized");

};

Redis.prototype.connect = function() {
	return redis.createClient();
};

Redis.prototype.disConnect = function() {
	redis.quit();
	return null;
};