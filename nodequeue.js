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

Queue.prototype.getAllJobsByStatus = function(jobStatus, sort, finalCallBack) {
	this.getAllJobsBy({
		key: "jobs.status",
		value: jobStatus
	}, sort, finalCallBack);
};

Queue.prototype.getAllJobsByName = function(jobName, sort, finalCallBack) {
	this.getAllJobsBy({
		key: "jobs.name",
		value: jobName
	}, sort, finalCallBack);
};

Queue.prototype.getAllJobsByStatusAndName = function(jobStatus, jobName, sort, finalCallBack) {
	this.getAllJobsByAnd({
		key: "jobs.status",
		value: jobStatus
	}, {
		key: "jobs.name",
		value: jobName
	}, sort, finalCallBack);
};

Queue.prototype.getAllJobsBy = function(jobObj, sort, finalCallBack) {
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

Queue.prototype.getAllJobsByAnd = function(jobObj1, jobObj2, sort, finalCallBack) {
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
			that.Database.client.hmset('job:' + id, { //Callback of incr, set the hash of job:incr
				"name": job.name,
				"status": job.status,
				"payload": job.payload,
				"priority": job.priority
			}, function() { //Callback of hmset, add incr to jobs list
				that.Database.client.rpush('jobs', id, function(err, res) { //Add id to jobs array
				});

				that.Database.client.sadd('jobs.status.' + job.status, id, function(err, res) { //Add status to type array
					cb(err, res); //Callback
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