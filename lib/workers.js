/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: workers.js
 */

var Workers = function(Queue) {
	this.Queue = Queue;
	this.WorkerFunctions = {};

	this.refreshInterval = 500;
	this.running = false;
	this.handle = '';
	console.log("Queue init");

};

Workers.prototype.start = function(functionArray, options) {
	var that = this;
	that.WorkerFunctions = functionArray;
	if (options) {
		that.refreshInterval = options.refreshInterval || 500;
	}
	this.handle = setInterval(function() {
		console.log('Iteration');
		if (!that.running) { //Don't process job if already running
			console.log("XXXXXXXXXXXXXXXXXXXX");
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

Workers.prototype.finishJob = function(Job, results) {
	console.log("Our job: " + Job.name + ' : ' + results);
	var that = this;

	if (results === this.Queue.JobType.complete || results === this.Queue.JobType.failed) {} else {
		results = this.Queue.JobType.failed; // results not passed as expected so job must have failed somewhere
	}
	that.Queue.updateJobStatus(Job, results, function() {
		that.Queue.setStatusDoneRunning(Job, function() {
			that.running = false;
		});
	});
};

Workers.prototype.stop = function() {
	if (this.handle === '') {
		console.log("Can't stop worker queue, it isn't running.");
	} else {
		clearInterval(this.handle);
		console.log("Worker Queue stopped.");
	}
};


Workers.prototype.processJob = function(Job, callBack) {
	var that = this;
	if (Job !== null) {
		this.running = true;
		//Checks if we have a function defined for the given job
		if (Job.name in this.WorkerFunctions) {
			this.Queue.updateJobStatus(Job, this.Queue.JobType.running, function() {
				//Run specified function for given job
				console.log("Trouble");
				that.WorkerFunctions[Job.name](Job, callBack);
			});
		} else {
			console.log("We don't have a function to handle the job named: " + Job.name);
			console.log(Job);
			callBack(Job, that.Queue.JobType.failed);
		}
	} else {
		console.log("We've run out of jobs!");
	}
};

Workers.prototype.getNextJob = function(cb) {
	var that = this;
	that.Queue.getAllJobsByStatus(that.Queue.JobType.queued, true, function(data) {
		if (data.length > 0) {
			cb(new that.Queue.Job(data[0]));
		} else {
			cb(null);
		}
	});
};

Workers.prototype.promoteDelayedJobs = function(cb) {
	cb = cb || function(){};
	var that = this;
	that.Queue.Database.client.sort('jobs.status.'+that.Queue.JobType.delayed, "by", "job:*->_startTime", "desc", "GET", "#", "GET", "job:*->_startTime", function(err, data) {
		console.log(data);
		cb();
	});
};

Workers.prototype._recursivePromotion = function(delayedJobArray,cb) {

};


//Expose Workers to require
//  - Requires require().init() since data must be passed to it
module.exports.init = function(Queue) {
	return new Workers(Queue);
};