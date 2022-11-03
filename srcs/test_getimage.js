// Description:
//   Utility commands surrounding Hubot uptime.
//
// Commands:
//   ping - Reply with pong
//   echo <text> - Reply back with <text>
//   time - Reply with current time
'use strict';
let roomid = "_223369629_-255844352";
let flg = false;
var linearray = [];
var picturenumber = [];
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
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

  robot.respond(/PING$/i, (res) => {
    // res.send(`This room id is ${res.message.room}`);
    console.log(res);
    res.send('PONG');
  });

  robot.send({
    room: roomid
  }, '思い出しているキーワード、または保存したい写真を教えて');

  robot.respond('select', (res) => {
     if (res.json.response === null) {
        res.send(`Your question is ${res.json.question}.`);
       } else {
            //console.log(picturenumber[res.json.response]);
            connection.execSql(new Request("select text from picturedetail where parent_picturenum = " + picturenumber[res.json.response] + ".",
             function(err, rowCount,rows) {
               if (err) {
                 console.log(err);
                 connection.close();
                 return;
               } else {
                        var textlinearrays = [];
                        rows.forEach(function(row) {
                          row.forEach(function(column) {
                            if (column.metadata.colName === 'text') {
                              const textline = column.value.split('\n');
                              textlinearrays.push(textline);
                              //connection.close();
                            }
                          });
                        });
                        console.log(textlinearrays);
                        robot.send({
                          room: roomid
                        }, 'Your select is :' + textlinearrays);
                          textcheck();

               }
            }));
        res.send(`Your answer is ${res.json.options[res.json.response]}.`);
       }
  });


  robot.respond(/(.*)/i, (res) => {
    let respondresult = res.message.text.match(/closing_type|stamp_set|in_reply_to|file_id/);
    if (respondresult) {
      return;
    }
    //入力したキーワードで検索を行う
    const keyword = res.match[1];
    console.log(keyword);
    const connection = new Connection(config);
    connection.on('connect', function(err) {
      if (err) {
        console.log(err);
        process.exit();
      } else {
        console.log('SQL connected.');
        getDatabase(keyword)
        // .then(choice);
      }
    });

})

function textcheck() {
 res.send({
   question: '確認したい文書ですか？'
 });
 robot.respond('yesno', (res) => {
   if (res.json.response === null) {
     res.send(`Your question is ${res.json.question}.`);
   } else {
     if (res.json.response === true) {
       res.send({
         room: roomid
       }, 'タスク終了');
       return;
     } else {
       res.send({
         question: '当てはまる選択肢がありますか？',
         options: linearray
       });
     }
   }
 });
}

function getDatabase(keyword) {
  const request = new Request("select " + getColumns('picturedata') + " from picture join picturedetail on picturenum = parent_picturenum and text like N'%" + keyword + "%'",
    function(err, rowCount, rows) {
      if (err) {
        console.log(err);
        connection.close();
        return;
      } else {
        //console.log(rows);
        if (rowCount > 0) {
          //クエリしてきた結果処理
          // console.log(rows);

          rows.forEach(function(row) {
            row.forEach(function(column) {
              if (column.metadata.colName === 'text') {
                const lines = column.value.split('\n');
                const line = lines.filter(function(line) {
                  return line.indexOf(keyword) !== -1;
                })[0];
                linearray.push(line);
                //connection.close();
              }else if (column.metadata.colName === 'parent_picturenum') {
                const numbers = column.value;
                picturenumber.push(numbers);
                }
            });
          });

          res.send({
            question: '当てはまる選択肢がありますか？',
            options: linearray
            // onsend: (sent) => {
            //   res.send({
            //    close_select: sent.message.id
            //  });
            // }
          })


        　　　　　　　　
        }
      }
    });
  connection.execSql(request);
}





  //
  //
  //
  //
  //
  // robot.respond(/ECHO (.*)$/i, (res) => {
  //   res.send(res.match[1]);
  // });
  //
  // robot.respond(/TIME$/i, (res) => {
  //   res.send(`Server time is: ${new Date()}`);
  // });

  function getColumns(...args) {
    const columns = ['picturenum', 'language', 'userid', 'date', 'picturedata', 'picturedetailnum', 'words', 'text', 'parent_picturenum'];
    return columns.filter(function(column) {
      return args.indexOf(column) === -1;
    }).join(',');
  }
};

//　res.send(`This room id is ${res.message.room}`);
//　console.log(res.message.rooms[res.message.room]);


//   res.send('This message is text.');
