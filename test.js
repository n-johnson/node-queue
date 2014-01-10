/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: test.js
 *       - Purely for testing
 */


var Queue = require('./nodequeue.js').init();
//var Queue = require('./nodequeue.js').init(6379,'redisServer.com');

var j = new Queue.Job({
	name: "userAdd",
	status: "DELAYED",
	payload: "bobert5696"
});

j.pushJob();

setTimeout(function() {
	Queue.getAllJobs(function(jobs) {
		console.log('All job callback:');
		console.log(jobs);
		Queue.Database.disconnect();
	});
}, 1500);

