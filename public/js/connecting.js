$(document).ready(function () {
    const socket = io();
    socket.on('wifi_connected', function (data) {
        window.location.href = 'smokerpi.kells.io';
    });
    socket.on('connection_failed', function (data) {
        window.location.href = '/';
    });
});