/*!
 * nodeQueue v0.0.1
 * Author: Nathan Johnson <node@njohnson.me>
 * License: MIT Licensed
 *
 * File: job.js
 *       - Job Class
 */


/**
 * [Job - Stores job data | Obj as opposed to hard coded variables allows for easier modification]
 * Accessable as a method of Queue
 * @param {[type]} obj {
 *                 name: "jobIdentifier", [Used in job execution (job "type")]
 *                 status: "[Delayed | Queued | Running | Failed | Complate]",
 *                 payload: "{jobData1:foo, jobData2:bar}", [Format agnostic, 100% controlled by application]
 *                 id: "85", [job:id storage in database] *
 * }
 */
var Job = function(obj) {
	if (obj) {
		this.name = obj.name;
		this.status = obj.status;
		this.payload = obj.payload;
		this.priority = obj.priority;
		this.id = obj.id || null;
	} else {
		this.name = null;
	}
};

//Expose job to require
module.exports = function(obj) {
	return new Job(obj);
};