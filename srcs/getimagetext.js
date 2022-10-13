'use strict';

const request = require('request');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

let subscriptionKey = '53d63922ac6d40e3885a8f1c3feae905';
let endpoint = 'https://getchenimagetext.cognitiveservices.azure.com/';
if (!subscriptionKey) { throw new Error('Set your environment variables for your subscription key and endpoint.'); }

app.use(bodyParser.json({ extended: true, limit: '10mb' }));

app.listen(8080, () => {
  console.log('Running at Port 8080...');
});

app.post('/', (req, res) => {
  const base64 = req.body.photo;
  const options = {
    uri: endpoint + 'vision/v2.1/ocr',
    body: new Buffer.from(base64, 'base64'),
    headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key' : subscriptionKey
    }
  };

  request.post(options, (error, response, body) => {
    if (error) {
      console.log('Error: ', error);
      return;
    }
    let jsonResponse = JSON.stringify(JSON.parse(body), null, '  ');
    console.log('JSON Response\n');
    console.log(jsonResponse);
    res.set('Content-Type', 'text/html');
    res.send(`<img src="data:text/plain;base64,${base64}">`);
  });

});
