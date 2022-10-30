
const logocanvas = document.getElementById('logocanvas');
const logoctx = logocanvas.getContext('2d');
const logotext = new Image();
logotext.src = './../logoIntroText.png';
logotext.onload = () => {
    let logoY = -0.9;
    let logoX = -0.1;
    let logoYSpeed = 0.01;
    let logoXSpeed = 0.01;
    let fadeX = 0;
    let fadeY = -0.1;
    let fadeXSpeed = -0.01;
    let draw = true;
    let timer = 0;
    let last = performance.now();
    let cameraShake = 0;
    let logodraw = setInterval(() => {
        timer += performance.now()-last;
        logocanvas.width = window.innerWidth;
        logocanvas.height = window.innerHeight;
        logoctx.imageSmoothingEnabled = false;
        logoctx.webkitImageSmoothingEnabled = false;
        logoctx.mozImageSmoothingEnabled = false;
        cameraShake *= 0.8;
        if (timer > 200 && logoY != 1 && timer < 2000) {
            logoYSpeed *= 1.2;
            logoY = Math.min(logoY+logoYSpeed, 1);
            if (logoY == 1) cameraShake = 10;
        }
        if (timer > 800 && logoX != 1 && timer < 2000) {
            logoXSpeed *= 1.2;
            logoX = Math.min(logoX+logoXSpeed, 1);
            if (logoX == 1) cameraShake = 20;
        }
        if (timer > 2000 && fadeY != 1) {
            fadeY = Math.ceil(Math.min(fadeY+(1-fadeY)*0.2, 1)*100)/100;
            if (fadeY == 1) {
                logoY = -0.9;
                logoX = -0.1;
                logoYSpeed = 0.01;
                logoXSpeed = 0.01;
                // draw = false;
                // logocanvas.style.backgroundColor = 'transparent';
            }
        }
        if (timer > 2600 && fadeX != -1) {
            fadeXSpeed *= 1.1;
            fadeX = Math.max(fadeX+fadeXSpeed, -1);
            if (fadeX == -1) {
                timer = 0;
                fadeX = 0;
                fadeY = -0.1;
                fadeXSpeed = -0.01;
                timer = 0;
                last = performance.now();
                // clearInterval(logodraw);
                // logocanvas.remove();
            }
        }
        let pxw = window.innerWidth*0.1;
        let pxh = window.innerHeight*0.1;
        if (draw) {
            logoctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            logoctx.fillStyle = '#000000';
            logoctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            logoctx.save();
            logoctx.translate(Math.random()*cameraShake*2-cameraShake, Math.random()*cameraShake*2-cameraShake);
            logoctx.translate(window.innerWidth/2, window.innerHeight/2);
            logoctx.rotate(Math.random()*cameraShake*0.004-cameraShake*0.002);
            logoctx.translate(-window.innerWidth/2, -window.innerHeight/2);
            logoctx.fillStyle = '#47D89F';
            logoctx.fillRect(pxw*2-pxh, pxh*4.5, pxh, pxh);
            logoctx.fillStyle = '#3C70FF';
            logoctx.fillRect(pxw*2-pxh*2, (pxh*5-pxh*1.5)*logoY, pxh*2, pxh);
            logoctx.fillRect(pxw*2-pxh*2, (pxh*5-pxh*1.5)*logoY, pxh, pxh*3);
            logoctx.fillStyle = '#FF0099';
            logoctx.fillRect(pxw*2-pxh, pxh*9-(pxh*5-pxh*1.5)*logoY, pxh*2, pxh);
            logoctx.fillRect(pxw*2, pxh*7-(pxh*5-pxh*1.5)*logoY, pxh, pxh*3);
            logoctx.drawImage(logotext, pxw*10-pxw*7*logoX, pxh*3.5, 19/5*pxh*3, pxh*3);
            logoctx.restore();
        }
        logoctx.fillStyle = '#202020';
        logoctx.fillRect(-pxw*10*fadeX, pxh*5*fadeY-pxh*5, pxw*10, pxh*5);
        logoctx.fillRect(pxw*10*fadeX, pxh*10-pxh*5*fadeY, pxw*10, pxh*5);
        last = performance.now();
    }, 20);
    document.addEventListener('keypress', skip = (e) => {
        if (e.key == ' ') {
            clearInterval(logodraw);
            logocanvas.remove();
            document.removeEventListener('keypress', skip);
        }
    });
}
