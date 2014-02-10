/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: webserver.js
 *       - Visualizes jobs as a web server via express
 */

var express = require('express');

var Webserver = function(port) {
	this.port = port;
	this.server = express();
};

Webserver.prototype.startListening = function() {
	this.serverHandle = this.server.listen(this.port);
};

Webserver.prototype.stopServer = function() {
	this.serverHandle.close();
	process.kill(0);
};

module.exports = function(port) {
	return new Webserver(port);
};