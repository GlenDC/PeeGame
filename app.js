// Import the Express module
var express = require('express');

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Create a new instance of Express
var app = express();
// Create a simple Express application

app.configure(function () {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'server')));


});
app.get('/', function (req, res) {
    res.send('Da app is running <br><br><br>&copy;Pee-game 2014')
});

var port = process.env.PORT || 3000;

// Create a Node.js based http server on port 8080
var server = require('http').createServer(app).listen(port);
app.set('title', 'Pee Game');
console.log("Starting server on port " + port);


//SOCKETS.IO STUFF

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    socket.on('gyro_data', function (data) {
        console.log(data);
    });
});
