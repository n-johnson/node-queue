/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: database.js
 *       - Wrapper for connecting to a redis database.
 *       - Potentially could be written for alternative KV stores
 */

var redis = require('redis');

/**
 * [Database - Redis wrapper]
 * @param {[integer]} port [Port of redis server]
 * @param {[String]} host [Hostname/IP of redis server]
 */
var Database = function(port, host) {
	this.port = port;
	this.host = host;
	this.client = this.connect();
	console.log("Database module initialized");
};

/**
 * [connect - Connect to server]
 * @return {[Redis.client()]} [Handle to access database]
 */
Database.prototype.connect = function() {
	var port = this.port || 6379; //Default port for redis
	var host = this.host || '127.0.0.1';
	console.log("Connecting: " + host + ':' + port);
	return redis.createClient(port, host);
};

/**
 * [disconnect - Disconnect from server]
 * @return {[null]}
 */
Database.prototype.disconnect = function() {
	console.log("Disconnecting from database");
	this.client.quit();
	return null;
};

/**
 * [incr - ]
 * @param  {[type]}   key [description]
 * @param  {Function} finalCallBack  [description]
 * @return {[type]}       [description]
 */
Database.prototype.incr = function(key, finalCallBack) {
	this.client.incr(key, function(err, id) {
		if (!err)
			return finalCallBack(id);
		else
			return finalCallBack(null);
	});
};


//Expose Database to require
//  - Requires require().init() since data must be passed to it
module.exports.init = function(port, host) {
	return new Database(port, host);
};