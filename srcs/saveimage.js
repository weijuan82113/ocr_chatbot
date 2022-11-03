'use strict';
let roomid = "_223369629_-255844352";
const request = require('request');
const fs = require('fs');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

const subscriptionKey = '53d63922ac6d40e3885a8f1c3feae905';
const endpoint = 'https://getchenimagetext.cognitiveservices.azure.com/';
const config = {
  authentication: {
    options: {
      userName: 'chen', // update me
      password: 'Willy@5467' // update me
    },
    type: 'default'
  },
  server: 'chenchatbotdatabase.database.windows.net', // update me
  options: {
    database: 'chenchatbotdatabase', //update me
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
}

module.exports = (robot) => {
  const onfile = (res, file) => {
    res.download(file, (path) => {
      const _file = fs.readFileSync(path);
      fs.unlinkSync(path);
      const options = {
        uri: endpoint + 'vision/v2.1/ocr',
        body: _file,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': subscriptionKey
        }
      }
      //APIと接続
      request.post(options, (error, response, body) => {
        if (error) {
          console.log('Error: ', error);
          return;
        }
        const jsontext = JSON.stringify(JSON.parse(body));
        const jsonobj = JSON.parse(body)


        const connection = new Connection(config);
        connection.on('connect', function(err) {
          if (err) {
            console.log(err);
          } else {
            queryDatabase(connection, jsonobj); //APIかえって来たデータを処理する
          }
        });
      });
      //APIと接続

      function queryDatabase(connection, jsonobj) {
        const request = new Request('SELECT NEXT VALUE for picturenum as next_value',
          function(err, rowCount, rows) {
            if (err) {
              console.log(err);
            } else {
              const sequence = rows[0][0].value;
              connection.execSql(new Request(
                `INSERT INTO picture(picturenum,language,userid,date,picturedata)
            VALUES(${sequence},'${jsonobj.language}','${roomid}',CAST(GETDATE() AS DATETIME), 0x${_file.toString('hex')})`,
                function(err, rowCount, rows) {
                  if (err) {
                    console.log(err);
                  } else {
                    let regions = [];
                    jsonobj.regions.forEach(function(obj) {
                      let words = [];
                      if (obj.lines) {
                        obj.lines.forEach(function(_obj) {
                          let texts = [];
                          if (_obj.words) {
                            _obj.words.forEach(function(__obj) {
                              if (__obj.text) texts.push(__obj.text);
                            });
                          }
                          if (texts.length) words.push(texts.join('') + '\n');
                        });
                        if (words.length) regions.push(words);
                      }
                    });
                    function insert(connection, sequence, _regions) {
                      if (!_regions.length) {
                        connection.close();
                        return;
                      }
                      const arr = regions.shift();
                      connection.execSql(new Request(
                        `INSERT INTO picturedetail(picturedetailnum, words, text, parent_picturenum)
                      VALUES(next value for picturedetailnum, ${arr.length}, N'${arr.join('')}', ${sequence});`,
                        function(err, rowCount, rows) {
                          if (err) {
                            console.log(err);
                            connection.close();
                          }
                          insert(connection, sequence, _regions);
                        }
                      ));
                    }
                    insert(connection, sequence, regions);
                  }
                }));
            }
          }
        );
        connection.execSql(request);
      }
      //DBと接続

    });
  }

  // # ファイルが1つだけの場合
  robot.respond('file', (res) => {
    onfile(res, res.json);
  });

  // # ファイルが複数の場合
  robot.respond('files', (res) => {
    for (const file of res.json.files) {
      onfile(res, file);
      if (res.json.text) {
        res.send(`with text: ${res.json.text}`);
      }
    }
  });

};
