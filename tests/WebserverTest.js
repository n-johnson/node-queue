/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: WebserverTest.js
 */

var ws = require('../lib/webserver')(3001);

ws.server.get('/', function(req, res) {
	console.log("Req");
	res.send('Hello World');
});

ws.server.get('/quit', function(req,res) {
  res.send('closing..');
  ws.stopServer();
});

ws.startListening();

// setTimeout(function() {
// 	ws.stopServer();
// }, 5000);