// Import the Express module
var express = require('express'),
    path = require('path'),
    util = require('util');

/** PLAYERS CONTAINS ALL ACTIVE PLAYERS*/
var players = [];


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
//    console.log("connect request from user incoming: \n" + JSON.stringify(req.body));
    var name = req.body.uid, color, detected;
    color = intToARGB(hashCode(name)).substring(0, 6);

    var player = {
        "player": {
            "uid": req.body.uid,
            "color": color,
            "gyro": {
                x : "no value :(",
                y : "no value :(",
                z : "no value :(",
                alpha : "no value :(",
                beta : "no value :(",
                gamma : "no value :("
            }
        }
    };

    if (players.length == 0) {
        players.push(player);
    } else {
        for (var i in players) {
            console.log(players[i].player.uid);
            var val = players[i];
            if (val.player.uid == player.player.uid) {
                detected = true;
            }
        }
        if (!detected) {
            players.push(player);
        }
    }
    req.method = 'get';
    res.redirect('server/device/connected.html?uid=' + name + '&color=' + color);
});


app.get('/device', function (req, res) {
    req.method = 'get';
    res.redirect('server/device/index.html');
});

var resetPlayerList = function () {
    players.pop();
    players = [];
};
app.post('/logout', function (req, res) {
    var name = req.body.uid;
    console.log("Name found => " + req.body.uid);

    if (players.length > 0 && players.length != 1) {

        var newplayers = [];
        for (var i in players) {

            console.log(players[i].player.uid);

            var val = players[i];

            if (val.player.uid != name) {
                newplayers.push(val.player);
            }
        }
        players = newplayers;

    } else {
        console.log("found only 1 player, empty playerslist");
        resetPlayerList();
        console.log(players);
    }

    req.method = 'get';
    res.redirect('server/device/index.html');
});


setInterval(function () {
    console.log(players);
    sendToMothership();
}, 700);

//SOCKETS.IO STUFF
var sendToMothership = function () {

    if (players.length > 0) {
        io.sockets.emit("mothership", players);
    } else {
        io.sockets.emit("mothership", {message : "noplayers"})
    }
};

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);
var noplayersmentioned = false;
// Reduce the logging output of Socket.IO
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    var self_socket = socket;



    socket.on('player_data', function (data) {
        var player = {
            "player": {
                "uid": data.uid,
                "color": data.color,
                "gyro": data.gyro
            }
        };
//        console.log("connection incoming from ",data);

        if (players.length == 0) {
            players.push(player);
        } else {
            for (var i in players) {
                var val = players[i].player;
                if (val != undefined && val.uid == player.player.uid) {
                    detected = true;
                    players[i]['player'].gyro = data.gyro;
                }
            }
            if (!detected) {
                players.push(player);
            }
        }
        sendToMothership();

    });
    self_socket.emit("mothership", {init: "server here"});
});



