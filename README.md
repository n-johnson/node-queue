nodeQueue
==========

nodeQueue is a simple job queue designed for node.js. It utilizes a redis server to store jobs, allowing a distributed network of servers to have access to the jobs.

##Installation

##Features

##Usage

###Init

In your application nodeQueue is called as:

``` js
var Queue = require('nodequeue').init();
```
or if the database isn't on the same server/a custom port is used:

``` js
var Queue = require('nodequeue').init(customPort,'redisServer.com');
```
###Job Creation
Jobs are very easy to create, simply build the object and pass it to Queue.pushJob(). The options are explained below.

``` js
var jobData = {
	name: jobName, // Unique identifier for a given class of jobs: determines which function will be used by worker
	status: 'QUEUED', //QUEUED: normal | DELAYED: set job execution at some time in the future
	payload: { //Any information you will need to process the job, can be any type of data, string or object
		customInfo1: 'abc',
		customInfo2: '123'},
	priority: 10, //Jobs are processed from highest priority to lowest regardless of when they are added
	delay: 15000 //(OPTIONAL) - If status is set to 'DELAYED', this is the number of milliseconds the job will be delayed by
};

var job = new Queue.Job(jobData);

Queue.pushJob(job, function() {
	//Optional callback function
});
```

###Workers
nodeQueue is very flexible in its workers, you can have as many or as few as you would like, located on any number of servers, as long as they are able to access the database which holds the job information.

Here is basic example of how the worker process should be setup:

``` js
var Queue = require('nodequeue').init();

/**
 * Define the functions your workers run here
 *
 * Worker is sent a Job as parameter
 * Worker must return a status via callBack function to receive another job
 * Status option:
 * 1. COMPLETE
 * 2. FAILED
 *
 */

var testFunction = function(Job, callBack) {

	// Execute job code here

	callBack(Job, Queue.JobType.complete); //Job was completed, send back COMPLETE
};

var testFunction2 = function(Job, callBack) {
	
	// Execute job code here

	callBack(Job, Queue.JobType.failed); // Job did not complete, send back FAILED
};

var WorkerFunctions = { // Match the job names up with their respective functions
	"jobName1": testFunction,
	"jobName2": testFunction2
};

var options = {
	refreshInterval: 500 // How often should we check for a job | DEFAULT: 500
};

Queue.Workers.start(WorkerFunctions, options); //Start the worker!
```