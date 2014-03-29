// Import the Express module
var express = require('express');

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Create a new instance of Express
var app = express();
// Create a simple Express application
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.configure(function () {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'server')));


});
app.get('/', function (req, res) {
    res.send('Da app is running <br><br><br>&copy;Pee-game 2014')
});

var port = 3000;

// Create a Node.js based http server on port 8080
var server = require('http').createServer(app).listen(port);
app.set('title', 'Pee Game');
console.log("Starting server on port " + port);


var hashCode = function (str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

var intToARGB = function (i) {
    return ((i >> 24) & 0xFF).toString(16) +
        ((i >> 16) & 0xFF).toString(16) +
        ((i >> 8) & 0xFF).toString(16) +
        (i & 0xFF).toString(16);
}

//HANDLE POST FORM
app.post('/connect', function (req, res) {
    console.log("connect request from user incoming: \n" + JSON.stringify(req.body));
    var name = req.body.uid, color;
    color = intToARGB(hashCode(name));

    req.method = 'get';
    res.redirect('/device/connected.html?uid=' + name + '&color=' + color);
});

//SOCKETS.IO STUFF

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    var self_socket = socket;

    var sendToMothership = function (data) {
        io.sockets.emit("mothership", {player: data});
    };
    socket.on('player_data', function (data) {
        console.log(data);
        sendToMothership(data);
    });
    self_socket.emit("mothership", {init: "server here"});


});
