/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: nodequeue.js
 *       - Primary class of nodeQueue module.
 */

/*Put this note somewhere better (like documentation once it exists)
 *     ****Note about callbacks*****
 * - When a callback is refered to as function cb(options) it is OPTIONAL
 * - When a callback is refered to as function finalCallBack(options) it is REQUIRED
 */

var Queue = function(port, server) {
	this.Database = require('./lib/database.js').init(port, server); //Initializes the database + expose as child
	this.Job = require('./lib/job.js'); //Exposes Job as a child of Queue
	this.Workers = require('./lib/workers.js').init(this);
};

Queue.prototype.JobType = {
	delayed: "DELAYED",
	queued: "QUEUED",
	running: "RUNNING",
	failed: "FAILED",
	complete: "COMPLETE"
};

/**
 * [getAllJobs - Pulls all jobs from the Queue in array of type Jobs]
 * @param  {[function]} finalCallBack(jobArray) - Handles data once returned *REQUIRED*
 * If there is an error in getting job ids from redis, callback will return null.
 * @return {[null]}               [Use callback function]
 */
Queue.prototype.getAllJobs = function(finalCallBack) {
	var that = this;
	that.Database.client.lrange('jobs', 0, -1, function(err, data) { //Gets job IDs from jobs list in database
		if (data && !err) {
			var jobIDs = (data + '').split(','); //Simple object -> array
			var blankArray = []; //pass along an initialized array
			that._recursiveJobLookup(jobIDs, blankArray, finalCallBack);
		} else {
			finalCallBack(null); //Something went wrong, send null callback
		}
	});
	return null;
};


/**
 * [getAllJobsByStatus - Finds jobs of a given status]
 * @param  {[string]} jobStatus     [DELAYED | QUEUED | etc]
 * @param  {[boolean]} sort          [Sort jobs by priority]
 * @param  {[function]} finalCallBack [function(data) - passes parameter data]
 * @return {[none]}
 */
Queue.prototype.getAllJobsByStatus = function(jobStatus, sort, finalCallBack) {
	this._getAllJobsBy({
		key: "jobs.status",
		value: jobStatus
	}, sort, finalCallBack);
};
/**
 * [getAllJobsByName - Finds jobs of a given name]
 * @param  {[type]} jobName
 * @param  {[boolean]} sort          [Sort jobs by priority]
 * @param  {[function]} finalCallBack [function(data) - passes parameter data]
 * @return {[none]}
 */
Queue.prototype.getAllJobsByName = function(jobName, sort, finalCallBack) {
	this._getAllJobsBy({
		key: "jobs.name",
		value: jobName
	}, sort, finalCallBack);
};
/**
 * [getAllJobsByStatusAndName - Finds jobs with both parameters matching]
 * @param  {[string]} jobStatus     [DELAYED | QUEUED | etc]
 * @param  {[type]} jobName
 * @param  {[boolean]} sort          [Sort jobs by priority]
 * @param  {[function]} finalCallBack [function(data) - passes parameter data]
 * @return {[none]}
 */
Queue.prototype.getAllJobsByStatusAndName = function(jobStatus, jobName, sort, finalCallBack) {
	this._getAllJobsByAnd({
		key: "jobs.status",
		value: jobStatus
	}, {
		key: "jobs.name",
		value: jobName
	}, sort, finalCallBack);
};

/**
 * [_getAllJobsBy - Called by wrapper functions]
 */
Queue.prototype._getAllJobsBy = function(jobObj, sort, finalCallBack) {
	var that = this;
	if (sort) { //Return sorted by priority
		that.Database.client.sort(jobObj.key + "." + jobObj.value, "by", "job:*->priority", "desc", function(err, data) {
			if (data && !err) {
				var jobIDs = (data + '').split(','); //Simple object -> array
				var blankArray = []; //pass along an initialized array
				that._recursiveJobLookup(jobIDs, blankArray, finalCallBack);
			} else {
				finalCallBack(null);
			}
		});
	} else {
		that.Database.client.smembers(jobObj.key + "." + jobObj.value, function(err, data) {
			if (data && !err) {
				var jobIDs = (data + '').split(','); //Simple object -> array
				var blankArray = []; //pass along an initialized array
				that._recursiveJobLookup(jobIDs, blankArray, finalCallBack);
			} else {
				finalCallBack(null);
			}
		});
	}
};
/**
 * [_getAllJobsByAnd - Called by wrapper functions]
 */
Queue.prototype._getAllJobsByAnd = function(jobObj1, jobObj2, sort, finalCallBack) {
	var that = this;
	if (sort) { //Return sorted by priority
		that.Database.client.sinterstore("temp.ss", jobObj1.key + "." + jobObj1.value, jobObj2.key + "." + jobObj2.value, function(err, data) { // && data together
			that.Database.client.sort("temp.ss", "by", "job:*->priority", "desc", function(err, data) { // sort data
				if (data && !err) {
					var jobIDs = (data + '').split(','); //Simple object -> array
					var blankArray = []; //pass along an initialized array
					that._recursiveJobLookup(jobIDs, blankArray, finalCallBack);
				} else {
					finalCallBack(null);
				}
			});
		});
	} else {
		that.Database.client.sinter(jobObj1.key + "." + jobObj1.value, jobObj2.key + "." + jobObj2.value, function(err, data) { // && data together
			if (data && !err) {
				var jobIDs = (data + '').split(','); //Simple object -> array
				var blankArray = []; //pass along an initialized array
				that._recursiveJobLookup(jobIDs, blankArray, finalCallBack);
			} else {
				finalCallBack(null);
			}
		});
	}
};

Queue.prototype.setStatusDoneRunning = function(job, cb) {
	var that = this;
	that.Database.client.srem('jobs.status.' + that.JobType.running, job.id, function(err, res) {
		cb();
	});
};

Queue.prototype.updateJobStatus = function(job, newStatus, cb) {
	console.log("lets update job status");
	var that = this;
	if (job.status !== newStatus) { //Make sure the status is actually different before we do anything
		console.log("new status verifited");
		that.Database.client.hmset('job:' + job.id, {
				"status": newStatus
			},
			function(err, res) {
				if (err === null) { // No error in update
					that.Database.client.srem('jobs.status.' + job.status, job.id, function(err, res) { // Remove job from old status array
						if (err === null) {
							that.Database.client.sadd('jobs.status.' + newStatus, job.id, function(err, res) { //Add id to new job status array
								if (err === null) {
									cb(); //Callback function
								} else {
									console.log('Error: ' + err);
									console.log('Error in sadd');
								}
							});
						} else {
							console.log('Error: ' + err);
							console.log('Error in srem');
						}
					});
				} else {
					console.log('Error: ' + err);
					console.log('Error in hmset');
				}
			});
	} else { // the status was unchanged, execute callback immediatley.
		return cb();
	}
};
/**
 * [pushJob - Pushes given job into the queue]
 * @param  {[Job]}   job [job set for the queue]
 * @param  {Function} cb(err, res) - Optional
 *  res = job ID
 * @return {[boolean]}
 *         - True = DB call made, no knowledge of success
 *         - False = Job was null, no call made
 */
Queue.prototype.pushJob = function(job, cb) {
	var that = this;
	cb = cb || function(err, res) {};
	if (job.name) {
		that.Database.incr("id:jobs", function(id) { //Increment redis variable id:jobs  
			//Callback of incr, set the hash of job:incr
			var jobDataArray = {
				"name": job.name,
				"status": job.status,
				"payload": job.payload,
				"priority": job.priority
			};
			if(typeof job.delay !== 'undefined') {
				jobDataArray.delay = job.delay;
			}
			if(typeof job._startTime !== 'undefined') {
				jobDataArray._startTime = job._startTime;
			}
			that.Database.client.hmset('job:' + id, jobDataArray, function() { //Callback of hmset, add incr to jobs list
				that.Database.client.rpush('jobs', id, function(err, res) { //Add id to jobs array
					//cb(err, res); //Callback
				});

				that.Database.client.sadd('jobs.status.' + job.status, id, function(err, res) { //Add status to type array
					//cb(err, res); //Callback
				});

				that.Database.client.sadd('jobs.name.' + job.name, id, function(err, res) { //Add status to type array
					cb(err, res); //Callback
				});
			});
		});
		return true;
	}
	console.log("Invalid data passed to Job");
	cb(null);
	return false;
};
/**
 * [_recursiveJobLookup - Grabs first id in jobIDarray, performs data lookup
 *                        and pushes it to jobObjectArray. When jobIDarray is
 *                        empty, finalCallBack(Job[]) will be called.
 * @param  {[type]} jobIDarray     [Contains array of IDs contained in jobs list from db]
 * @param  {[type]} jobObjectArray [Contains array of Job objects as they are created]
 * @param  {[type]} finalCallBack  [ finalCallBack(Job[array]); ]
 * @return {[null]}
 */
Queue.prototype._recursiveJobLookup = function(jobIDarray, jobObjectArray, finalCallBack) {
	var that = this;
	if (jobIDarray.length === 0) { //We're done! Send data back
		return finalCallBack(jobObjectArray);
	}

	var currentID = jobIDarray.shift(); //Removes first element from array and returns it

	that.Database.client.hgetall('job:' + currentID, function(err, obj) {
		if (obj && !err) {
			var jobObj = new that.Job({
				name: obj.name,
				status: obj.status,
				payload: obj.payload,
				priority: obj.priority,
				id: currentID
			});
			if (jobObj.name) //Make sure it's a valid job before we push it
				jobObjectArray.push(jobObj);
		}

		that._recursiveJobLookup(jobIDarray, jobObjectArray, finalCallBack); //Recursion until array empty
	});
	return null;
};

/**
 * [init - Must be called when class is required]
 * require('nodequeue.js').init(options);
 * @param  {[type]} port   [Redis Server Port]
 * @param  {[type]} server [Redis Server Host]
 * @return {[Queue]}        [Returns/exposes the job Queue to the application]
 */
module.exports.init = function(port, server) {
	console.log("init main");
	return new Queue(port, server);
};