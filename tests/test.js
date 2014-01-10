var Queue = require('../nodequeue.js').init();
//var Queue = require('./nodequeue.js').init(6379,'redisServer.com');

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomJobType() {
	var rand = getRandomInt(1, 5);
	switch (rand) {
		case 1:
			return 'DELAYED';
			break;
		case 2:
			return 'QUEUED';
			break;
		case 3:
			return 'RUNNING';
			break;
		case 4:
			return 'FAILED';
			break;
		case 5:
			return 'COMPLETE';
			break;
	}
}

function getRandomName() {
	var rand = getRandomInt(1, 4);
	switch (rand) {
		case 1:
			return 'userAdd';
			break;
		case 2:
			return 'userDel';
			break;
		case 3:
			return 'genStats';
			break;
		case 4:
			return 'sendEmail';
			break;
	}
}

var j = new Queue.Job({
	name: getRandomName(),
	status: getRandomJobType(),
	payload: "bobert5696",
	priority: getRandomInt(0,30)
});

Queue.pushJob(j);

/*setTimeout(function() {
	Queue.getAllJobs(function(jobs) {
		console.log('All job callback:');
		console.log(jobs);
		Queue.getAllJobsByName("sendEmail",true,function(jobs) {
			console.log(jobs);
					Queue.Database.disconnect();
		});
	});
}, 500);*/

setTimeout(function() {
	Queue.getAllJobsByStatusAndName("DELAYED","sendEmail", true, function(jobs) {

		console.log(jobs);

	});
}, 500);