/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: TestMaster.js
 *       - Run this file to perform application tests.
 */

var JobCreation = require('./JobCreationTests');
var WorkerTests = require('./WorkerTest');

JobCreation.runTests(30, function() { //Number of jobs to add to queue
	WorkerTests.runTests(10, function() { //Number of seconds to process for
		console.log("All tests have completed successfully.");
		process.exit(0);
	});
});