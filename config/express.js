let express = require('express');
let bodyParser = require('body-parser');
let path = require('path');

module.exports = function() {
	let app = express();
	
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());

	app.use('/gallery', express.static('public'));

	app.get('/gallery', function(req,res) {
		res.sendFile(path.join(__dirname + '/../index.html'));
	});

	return app;
};
