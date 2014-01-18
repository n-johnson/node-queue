/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: workers.js
 */

var Workers = function(Queue) {
	this.Queue  = Queue;
	this.WorkerFunctions = {};

	this.refreshInterval = 500;
	console.log("Queue init");
};

Workers.prototype.start = function(functionArray, options) {
	var that = this;
	that.WorkerFunctions = functionArray;
	if (options) {
		that.refreshInterval = options.refreshInterval || 500;
	}
	setInterval(function() {
		if (!that.running) { //Don't process job if already running
			that.getNextJob(function(Job) {
				console.log("We got a job.");
				console.log(Job);
				that.processJob(Job, function(Job, jobResults) {
					that.finishJob(Job, jobResults);
				});
			});
		}
		that.promoteDelayedJobs();
	}, that.refreshInterval);
};

Workers.prototype.finishJob = function(Job,results) {
	console.log("Our job: " + Job.name + ' : '+ results);
	var that = this;

	if(results === 'COMPLETE' || results === 'FAILED') {} else {
		results = ' FAILED'; // results not passed as expected so job must have failed somewhere
	}

	that.Queue.Database.client.hmset('job:' + Job.id, {
			"status": results
		},
		function() {
			//Callback from redis update
			this.running = false;
		});
};

Workers.prototype.kill = function() {

};


Workers.prototype.processJob = function(Job,callBack) {
	this.running = true;
	//Checks if we have a function defined for the given job
	if (Job.name in this.WorkerFunctions) {
		//Run specified function for given job
		this.WorkerFunctions[Job.name](Job,callBack);
	} else {
		console.log("We don't have a function to handle the job named: " + Job.name);
		console.log(Job);
		callBack(Job,'FAILED');
	}
};

Workers.prototype.getNextJob = function(cb) {
	var that = this;
	console.log(that.Queue.JobType.queued);
	this.Queue.getAllJobsByStatus(that.Queue.JobType.queued, true, function(data) {
		console.log(data);
		exit(-1);
		console.log(data[0]);
		if (data.length > 0) {
			cb(new that.Queue.Job(data[0]));
		} else {
			cb(null);
		}
	});
};

Workers.prototype.promoteDelayedJobs = function() {
console.log("TODO Promoting delayed jobs");
};

//Expose Workers to require
//  - Requires require().init() since data must be passed to it
module.exports.init = function(Queue) {
	return new Workers(Queue);
};
