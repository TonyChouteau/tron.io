// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.css', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.css'));
});
app.get('/game.js', function (request, response) {
    response.sendFile(path.join(__dirname, 'game.js'));
});
app.get('/explosion.js', function (request, response) {
    response.sendFile(path.join(__dirname, 'explosion.js'));
});

// Starts the server.
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});

let players = {};
let speed = 6;
let rotationSpeed = Math.PI / 10;
let width = 900;
let height = 900;

// Add the WebSocket handlers
io.on('connection', function (socket) {
    socket.on('new player', function (w, h) {
        //console.log(w,h, Math.random(0,w), Math.random(0,h));
        players[socket.id] = {
            x: Math.random() * w,
            y: Math.random() * h,
            angle: 0.0,
            color: '#' + Math.floor(Math.random() * (16777215 - 8388607) + 8388608).toString(16),
            movement: {},
            line: [],
            time: 0,
        }
        players[socket.id].angle = Math.atan2(players[socket.id].x - w / 2, players[socket.id].y - h / 2) + Math.PI;
        players[socket.id].line.push({
            x: players[socket.id].x,
            y: players[socket.id].y
        });
    });

    socket.on('movement', function (movement) {
        if (players[socket.id] != undefined) {
            players[socket.id].movement = movement;
            players[socket.id].time = 0;
        }
    });
});

setInterval(function () {
    for (let id in players) {

        if (players[id].movement.left || players[id].movement.right) {
            players[id].line.push({
                x: players[id].x,
                y: players[id].y
            });
        }
        
        players[id].y += speed * Math.cos(players[id].angle);
        players[id].x += speed * Math.sin(players[id].angle);

        if (players[id].movement.left) {
            players[id].angle += rotationSpeed;
        }
        if (players[id].movement.right) {
            players[id].angle -= rotationSpeed;
        }

        players[id].time += 1;

        //Player segment
        let x11 = players[id].line[players[id].line.length-1].x;
        let y11 = players[id].line[players[id].line.length-1].y;
        let x12 = players[id].x;
        let y12 = players[id].y;

        let mustBeDestroyed = false;
        for (let id2 in players){
            //Other player segment
            for (let i=1; i<players[id2].line.length; i++){
                let x21 = players[id2].line[i-1].x;
                let y21 = players[id2].line[i-1].y;
                let x22 = players[id2].line[i].x;
                let y22 = players[id2].line[i].y;
                if (segment_intersection(x11,y11,x12,y12 , x21,y21,x22,y22) != false){
                    //console.log("x");
                    mustBeDestroyed = true;
                }
            }
            let x21 = players[id2].line[players[id2].line.length-1].x;
            let y21 = players[id2].line[players[id2].line.length-1].y;
            let x22 = players[id2].x;
            let y22 = players[id2].y;
            if (segment_intersection(x11,y11,x12,y12 , x21,y21,x22,y22) != false){
                //console.log("x");
                mustBeDestroyed = true;
            }
        }

        if (players[id].y >= height || 
            players[id].x >= width || 
            players[id].x <= 0 || 
            players[id].y <= 0 ||
            players[id].time >= 150 ||
            mustBeDestroyed) {
                
            io.sockets.emit('explosion', players[id]);
            delete players[id];
        }
    }
    io.sockets.emit('state', players);
}, 1000 / 30);

// Adapted from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
var eps = 0.0000001;
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
}
function segment_intersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    //console.log(x1,y1,x2,y2, x3,y3,x4,y4, x, y);
    //console.log(Math.abs(x-eps)<0.01);
    if (Math.abs(x-x1)<eps) {
        return false;
    } else {
        return {x: x, y: y};
    }
} 
