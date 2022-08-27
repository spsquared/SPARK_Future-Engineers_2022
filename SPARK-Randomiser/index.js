ctx = canvas.getContext('2d');

ctx.canvas.width = 3100;
ctx.canvas.height = 3100;
ctx.scale(10,10);

var resetField = function(){
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0,0,310,310);
    ctx.clearRect(5,5,300,300);
    ctx.fillRect(105,105,100,100);
    for(var i = 0;i < 4;i++){
        drawPillarCircle(105,45);
        drawPillarCircle(105,65);
        drawPillarCircle(155,45);
        drawPillarCircle(155,65);
        drawPillarCircle(205,45);
        drawPillarCircle(205,65);
        ctx.translate(155,155);
        ctx.rotate(0.5 * Math.PI);
        ctx.translate(-155,-155);
    }
}
var drawPillarCircle = function(x,y){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 1,y - 1,2,2);
    ctx.beginPath();
    ctx.arc(x,y,4,0,2 * Math.PI);
    ctx.stroke();
}
var drawStartingPosition = function(rotations,position){
    ctx.translate(155,155);
    ctx.rotate(0.5 * Math.PI * rotations);
    if(position === 0){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(-50,-150,50,40);
    }
    else if(position === 1){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0,-150,50,40);
    }
    else if(position === 2){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(-50,-110,50,20);
    }
    else if(position === 3){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0,-110,50,20);
    }
    else if(position === 4){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(-50,-90,50,40);
    }
    else if(position === 5){
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0,-90,50,40);
    }
    ctx.translate(-155,-155);
}

resetField();

randomiseWithoutPillars.onclick = function(){
    resetField();
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    if(Math.random() < 0.5){
        startX = 105;
    }
    else{
        startX = 65;
    }
    if(Math.random() < 0.5){
        startY = 105;
    }
    else{
        startY = 65;
    }
    if(Math.random() < 0.5){
        endX = 205;
    }
    else{
        endX = 245;
    }
    if(Math.random() < 0.5){
        endY = 205;
    }
    else{
        endY = 245;
    }
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(startX,startY,endX - startX,endY - startY);
    startingLocation = Math.floor(Math.random() * 4);
    if(startingLocation === 0){
        if(startY === 105){
            startingPosition = Math.floor(Math.random() * 6);
            drawStartingPosition(0,startingPosition);
        }
        else{
            startingPosition = Math.floor(Math.random() * 4);
            drawStartingPosition(0,startingPosition);
        }
    }
    else if(startingLocation === 1){
        if(endX === 205){
            startingPosition = Math.floor(Math.random() * 6);
            drawStartingPosition(1,startingPosition);
        }
        else{
            startingPosition = Math.floor(Math.random() * 4);
            drawStartingPosition(1,startingPosition);
        }
    }
    else if(startingLocation === 2){
        if(endY === 205){
            startingPosition = Math.floor(Math.random() * 6);
            drawStartingPosition(2,startingPosition);
        }
        else{
            startingPosition = Math.floor(Math.random() * 4);
            drawStartingPosition(2,startingPosition);
        }
    }
    else if(startingLocation === 3){
        if(startX === 105){
            startingPosition = Math.floor(Math.random() * 6);
            drawStartingPosition(3,startingPosition);
        }
        else{
            startingPosition = Math.floor(Math.random() * 4);
            drawStartingPosition(3,startingPosition);
        }
    }
}
reset.onclick = resetField;