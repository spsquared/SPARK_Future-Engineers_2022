socket = new WebSocket('ws://192.168.1.151:4040');

socket.onmessage = function(e) {
    const div = document.createElement('div');
    div.innerText = e.data;
    document.body.appendChild(div)
}
socket.onopen = function() {
    document.onkeydown = function(e) {
        const key = e.key.toLowerCase();
        socket.send(JSON.stringify({event: 'key', data: {key: key}}));
    };
    document.onkeyup = function(e) {
        const key = e.key.toUpperCase();
        socket.send(JSON.stringify({event: 'key', data: {key: key}}));
    };
};
socket.onclose = function() {
    const div = document.createElement('div');
    div.innerText = 'oh no disconnected';
    document.body.appendChild(div)
};