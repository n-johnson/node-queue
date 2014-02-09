/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: JobCreationTests.js
 */

var Queue = require('../nodequeue.js').init();
//var Queue = require('./nodequeue.js').init(6379,'redisServer.com');

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var testStatusArray = [Queue.JobType.delayed, Queue.JobType.queued];

function getRandomJobType() {
	return testStatusArray[getRandomInt(0, 1)];
}

var testNameArray = ['userAdd', 'userDel', 'genStats', 'sendEmail'];

function getRandomName() {
	return testNameArray[getRandomInt(0, 3)];
}

function getRandomText(numberOfCharactersLow, numberOfCharactersHigh) {
	var numbChar = getRandomInt(numberOfCharactersLow, numberOfCharactersHigh);
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
	var returnText = '';
	for (var i = 0; i < numbChar; i++) {
		returnText += possible.charAt(getRandomInt(0, 62));
	}
	return returnText;
}

function generateRandomJobArray(numberOfJobs) {
	var jobArray = [];
	for (var i = 0; i < numberOfJobs; i++) {
		var jData = {
			name: getRandomName(),
			status: getRandomJobType(),
			payload: getRandomText(3, 50),
			priority: getRandomInt(0, 30)
		};
		if(jData.status == Queue.JobType.delayed) {
			jData.delay = getRandomInt(15000,1000*60*30);
		}
		var j = new Queue.Job(jData);
		console.log(j);
		jobArray[i] = j;
	}
	return jobArray;
}

//Compares each Job in array 'data' against expected the expected data.
//Exits in an error if there is one.
//If no error, returns callback function cb()
function checkJobs(data, cb) {
	for (var i = 0; i < data.length; i++) {
		if (testNameArray.indexOf(data[i]['name']) !== -1) {
			if (testStatusArray.indexOf(data[i]['status']) !== -1) {
				if (typeof data[i]['payload'] === 'string' && data[i]['payload'] !== '') {
					if (data[i]['priority'] > -1) {
						if (data[i]['id'] > -1) {
							//Success, all of the data is in the form it is expected to be in.
							continue;
						} else {
							console.log('ERROR! The given id value was invalid.');
							console.log(data[i]);
							process.exit(1);
						}
					} else {
						console.log('ERROR! The given priority value was invalid.');
						console.log(data[i]);
						process.exit(1);
					}
				} else {
					console.log('ERROR! The given payload value was invalid.');
					console.log(data[i]);
					process.exit(1);
				}
			} else {
				console.log('ERROR! The function status returned was not found in potential statuses given in test array.');
				console.log(data[i]);
				process.exit(1);
			}
		} else {
			console.log('ERROR! The function name returned was not found in potential names given in test array.');
			console.log(data[i]);
			process.exit(1);
		}
	}
	console.log("Example data: ");
	console.log(data[0]);
	return cb();
}

//Flush database -- beginning of testing, cb = callback function
function flush(cb) {
	cb = cb || function() {};
	Queue.Database.client.flushdb(function(err, res) {
		if (err !== null) {
			console.log("Couldn't flush the database, exiting.");
			process.exit(1);
		}
		console.log("The cache was flushed.");
		return cb();
	});
}

//Recursive function to add all jobs to queue jobArray = generated job array
function addSomeJobs(jobArray, cb) {
	if (jobArray.length === 0) {
		return cb();
	}
	var curJob = jobArray.shift(); //Pulls the first item off of the array
	Queue.pushJob(curJob, function() {
		return addSomeJobs(jobArray, cb);
	});
}

exports.runTests = function(numberOfJobs, cb) {
	flush(function() { //Test 1 - flush database
		var jobArray = generateRandomJobArray(numberOfJobs); //Test 2 - Create a Job(s)
		addSomeJobs(jobArray, function() { //Test 3 - Push jobs to database recursively
			console.log("Callback post adding jobs.");
			Queue.getAllJobs(function(data) { //Test 4 - Retrieve jobs
				console.log("Callback post getAllJobs()");
				checkJobs(data, function() { //Test 5 - Verify job data is correct
					console.log("Callback post checkJobs()");
					console.log("JobCreationTests Completed Successfully.");
					cb();
				});
			});
		});
	});
};