addEventListener('DOMContentLoaded', () => {
    const wsHost = 'ws://localhost:8080/';
    const ws = new WebSocket(wsHost);
    
    const overlay = document.querySelector('div#overlay');
    const coinSound = document.querySelector('audio#audioCoin');

    const msgHandler = (msg) => {
        console.log(msg.data);
        moveOverlayBy(Number(msg.data) * 2);
    };

    const moveOverlayBy = (diff) => {
        meter -= diff;
        overlay.style.top = `${meter}px`;

        if (meter <= - document.documentElement.clientHeight) {
            meter = 0;
            coinSound.play();

            setTimeout(() => {
                overlay.style.top = '';
            }, 3000);
        }
    };

    let meter = 0;

    ws.addEventListener('message', msgHandler);
});