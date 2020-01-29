var socket = io();

let movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

let explos = [];

setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 30);


function setup() {
    createCanvas(900, 900);

    background(50);
    ellipseMode(CENTER);
}

function start(){
    console.log("x");
    let name = document.getElementById("name").value;
    socket.emit('new player', width, height, name);
}


function keyPressed(event) {
    //console.log(event.keyCode);
    switch (event.keyCode) {
        case 37: // A
            movement.left = true;
            break;
        case 38: // W
            movement.up = true;
            break;
        case 39: // D
            movement.right = true;
            break;
        case 40: // S
            movement.down = true;
            break;
    }
}

function keyReleased(event) {
    //console.log(event.keyCode);
    switch (event.keyCode) {
        case 37: // A
            movement.left = false;
            break;
        case 38: // W
            movement.up = false;
            break;
        case 39: // D
            movement.right = false;
            break;
        case 40: // S
            movement.down = false;
            break;
    }
}

socket.on('state', function (players) {
    background(50);
    for (let id in players) {
        strokeWeight(2);
        stroke(players[id].color);
        for (let i=1; i<players[id].line.length; i++){
            line(players[id].line[i].x,players[id].line[i].y, players[id].line[i-1].x,players[id].line[i-1].y);
        }
        //console.log(players[id].line)
        line(players[id].line[players[id].line.length-1].x,players[id].line[players[id].line.length-1].y, players[id].x,players[id].y);
        
        fill(255);
        noStroke();
        push();
        translate(players[id].x, players[id].y);
        text(players[id].name,10,10);
        pop();

        fill(players[id].color);
        if (id === socket.id){
            strokeWeight(3);
            stroke("#FF0000");
        }

        push();
        translate(players[id].x, players[id].y);
        rotate(-players[id].angle);
        ellipse(0,0,10, 20);
        pop();
    }
});

socket.on('explosion', function (player) {
    console.log("Explosion");
});

/*function draw(){

}*/