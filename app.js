// Import the Express module
var express = require('express');

// Import the 'path' module (packaged with Node.js)
var path = require('path');

var util = require('util');

// Create a new instance of Express
var app = express();
// Create a simple Express application
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.configure(function () {
    // Turn down the logging activity
    app.use(express.logger('dev'));

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname)));


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
    var name = req.body.uid, color, detected;
    color = intToARGB(hashCode(name));

    var player = {
        "player": {
            "uid": req.body.uid,
            "color": "#" + color
        }
    };

    for (var i in players) {
        val = players[i];
        if (val == player) {
            detected = true;
        }
    }
    if (!detected) {
        players.push(player);
    }
    req.method = 'get';
    res.redirect('server/device/connected.html?uid=' + name + '&color=' + color);
});

app.get('/device', function (req, res) {
    req.method = 'get';
    res.redirect('server/device/index.html');
});


var players = [];

setInterval(function () {
    util.print("\u001b[2J\u001b[0;0H");
    console.log("Starting server on port " + port);
    console.log("Dicks detectes");
    console.dir(players);

}, 500);

//SOCKETS.IO STUFF

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    var self_socket = socket;

    var sendToMothership = function (data) {
        var player = {
            "player": {
                "uid": data.uid,
                "color": "#" + data.color,
                "gyro": data.gyro
            }
        };
        console.log("connection incoming from " + data.uid)
        io.sockets.emit("mothership", {player: player});
    };
    socket.on('player_data', function (data) {
        sendToMothership(data);
    });
    self_socket.emit("mothership", {init: "server here"});
});



