/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: WorkerTest.js
 */

//Load main application
var Queue = require('../nodequeue.js').init();

/**
 * Define the functions your workers run here
 *
 * Example function:
 * var testFunction = function(Job) {
 *      return status;
 * }
 *
 * Worker is sent a Job as parameter
 * Worker must return a status to receive another job
 * Status option:
 * 1. COMPLETE
 * 2. FAILED
 *
 */

var lookupUserFunc = function(Job, callBack) {
	console.log("lookupUserFunc being ran by worker");
	console.log(Job);
	var now = Date.now();
	while (Date.now() < now + 5000) {
		//Sleep hack to observe working state like it would function in working conditions
	}
	callBack(Job, Queue.JobType.complete);
};

var secondFunc = function(Job, callBack) {
	console.log("secondFunction being ran by worker");
	console.log(Job);

	callBack(Job, Queue.JobType.failed);
};

/**
 * [WorkerFunctions - This object is a map Job names to their respective functions]
 * @type {Object}
 */
var WorkerFunctions = {
	"genStats": lookupUserFunc,
	"userAdd": lookupUserFunc,
	"userDel": lookupUserFunc,
	"sendEmail": lookupUserFunc
};


exports.runTests = function(runTime, cb) {
	//Start the workers!
	var options = {
		refreshInterval: 500
	};
	Queue.Workers.start(WorkerFunctions, options);

	setTimeout(function() {
		Queue.Workers.stop();
		return cb();
	}, runTime * 1000);
};