{
    const express = require('express');
    const serveIndex = require('serve-index');
    const expressWs = require('express-ws');

    const rootDir = './';
    const expApp = express();
    const expWsInst = expressWs(expApp);

    const wss = [];

    expApp.use(
        express.static('./'),
        serveIndex(rootDir, {
            icons: true
        })
    );
    expWsInst.app.ws('/', (ws) => {
        wss.push(ws);

        ws.on('close', () => {
            wss.splice(wss.indexOf(ws), 1);
        });

        console.log('connected');
    });

    expApp.listen(8080);

    const handleData = (series) => {
        let mean = series[0].norm;

        for (let iter = 1; iter < series.length - 1; iter += 1) {
            mean += series[iter].norm / (series.length - 1);
        }

        {
            const ratio = series.slice(-1)[0].norm / mean;

            if (ratio > 1.2) {
                console.log(ratio);
                wss.forEach((ws) => {
                    ws.send(ratio);
                });
            }
        }
    };

    const getNorm = (v) => {
        let ret = 0;

        v.forEach((elem) => {
            ret += elem * elem;
        });

        return Math.sqrt(ret);
    };

    {
        const maxSeriesLength = 2;

        const series = [];
        const buffer = [];

        const SerialPort = require('serialport');
        const port = new SerialPort(
            'COM3',
            {
                baudRate: 9600
            }
        );

        port.on('data', (data) => {
            const dataStr = data.toString();
            buffer.push(dataStr);

            if (/\n/.test(dataStr)) {
                const chunks = buffer.join('').split('\n');

                buffer.splice(0);
                if (/^\s*$/.test(chunks.slice(-1)[0])) {
                    buffer.push(chunks.pop());
                }

                chunks.forEach((chunk) => {
                    const elems = chunk.split(',');
                    const sample = {};

                    sample.vector = [];

                    elems.forEach((elem) => {
                        sample.vector.push(parseInt(elem, 10));
                    });

                    sample.norm = getNorm(sample.vector);

                    series.push(sample);

                    if (series.length > maxSeriesLength) {
                        series.splice(0, series.length - maxSeriesLength);
                    }
                });

                handleData(series);
            }
        });
    }
}
