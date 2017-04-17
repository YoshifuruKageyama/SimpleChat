var http = require('http');
var fs = require('fs');
var validator = require('validator');
var port = process.env.PORT || 8001;
var ip = process.env.IP || '127.0.0.1';
var server = http.createServer(function (req, res) {;
    fs.readFile("chat.html", 'utf-8', function (err, data) {
        //開こうとしているファイルでContent-Typeを変える
        var content_types = {
            html: { 'Content-Type': 'text/html' }, 
            css: { 'Content-Type': 'text/css' },
            jpg: { 'Content-Type': 'image/jpg' },
            png: { 'Content-Type': 'image/png' },
        }
        res.writeHead(200, content_types['html']);
        res.write(data);
        res.end();
    });
}).listen(port);

//管理クライアント用認証key
var auth_key = keyGen();

console.log('crate AuthKey: ' + auth_key);

var io = require('socket.io').listen(server);

//管理用ソケットid
var admin_socket_id;

//接続イベント
io.sockets.on('connection', function (socket) {
  console.log("connect:" + socket.id);
  console.log("connections:" + Object.keys(io.sockets.sockets).length);
  socket.on('say_all', function (msg) {
    var send_message = validator.escape(msg.message);
    console.log("start" + new Date());
    io.emit('greeting', {
      message: send_message,
      time_stamp: +new Date(),
      send_from: socket.id
    });
    console.log("End" + new Date());
  });

  socket.on('say_room', function (msg) {
    var send_message = validator.escape(msg.message);
    io.emit('greeting', {
      message: send_message,
      time_stamp: +new Date(),
      send_from: socket.id
    });
  });

  socket.on('say_user', function (msg) {
    var send_message = validator.escape(msg.message);
    io.emit('greeting', {
      message: send_message,
      time_stamp: +new Date(),
      send_from: socket.id
    });
  });
  //切断中
  socket.on('disconnecting', function (msg) {
    console.log("disconnecting:" + socket.id);
  });
  //切断
  socket.on('disconnect', function (msg) {
    //管理クライアントが切断した場合はkeyを再生成する
    if (isAdmin(socket.id)) {
      admin_socket_id = null;
      auth_key = keyGen();
      console.log('crate AuthKey: ' + auth_key);
    }
    console.log("disconnect:" + Object.keys(io.sockets.sockets).length);
  });
  //error
  socket.on('error', function (msg) {
    console.log("error:" + Object.keys(io.sockets.sockets).length);
  });
  /* msg:{id: client_id} */
  socket.on('kick', function (msg) {
    if (isAdmin(socket.id)) {
      io.broadcast.to(msg.id).emit('kick', { disconnect: 'me' });
      console.log(msg.id + 'kick');
    }
  });

  socket.on('user_list', function (msg) {
    io.clients(function (error, clients) {
      if (error) throw error;
      socket.emit('user_list', JSON.stringify(clients));
    });
  });

  socket.on('room_list', function (msg) {
    io.broadcast.to(sockte.id).emit();
    console.log("error:" + Object.keys(io.sockets.sockets).length);
  });
  /* msg:{auth_key: admin_key} */
  socket.on('authentication', function (msg) {
    if (msg.auth_key == auth_key && admin_socket_id == null) {
      admin_socket_id = socket.id;
      socket.emit('authentication_complete', { message: 'hi!admin' });
      console.log('admin connect');
    } else {
      console.log("try admin authentication ip:" + socket.handshake.address);
    }
  });
});

function keyGen() {
  return Math.floor(10000000 * Math.random()).toString(16);
}

function isAdmin(socketid) {
  return socketid == admin_socket_id;
}

