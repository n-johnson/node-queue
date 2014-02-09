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
 *                 id: "85", [job:id storage in database]
 *                 delay: "5000", [number of milliseconds to delay before job execution]
 * }
 */
var Job = function(obj) {
	if (obj) {
		this.name = obj.name;
		this.status = obj.status;
		this.payload = obj.payload;
		this.priority = obj.priority;
		this.id = obj.id || null; // Should not be given manually, only when retrieved
		console.log("St: " + this.status);
		if (typeof obj.delay !== 'undefined') {
			this.delay = obj.delay;
			this._startTime = Date.now() + this.delay;
		}
		//Make sure if the status is set to delayed that there is a delay time set, if there isn't, change status to queued
		if (this.status === 'DELAYED') { //DELAYED is hard coded in this instance because Job does not have access to Queue.JobTypes. Bad program design. Fix later.
			if (typeof this.delay !== 'number') {
				this.status = 'QUEUED';
			}
		}
	} else {
		this.name = null;
	}
};



//Expose job to require
module.exports = function(obj) {
	return new Job(obj);
};