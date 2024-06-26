const { Socket } = require('dgram');
var express = require('express');
var app = express();

const fs = require('fs');

let sslOptions = {
    key:fs.readFileSync('./ssh/privkey.key'),//里面的文件替换成你生成的私钥
    cert:fs.readFileSync('./ssh/cacert.pem')//里面的文件替换成你生成的证书

}

const https = require('https').createServer(sslOptions,app);

var io = require('socket.io')(https);

// var path = require('path');
// app.use(express.static(path.join(__dirname,'public')));

const port = 4443; // 4449
https.listen(port, function() { 
    console.log('listening on https://192.168.43.136:'); //192.168.43.136  172.17.116.167
});

app.get('/', (req,res) => {
    res.sendFile(__dirname + '/people.html');
})

io.on("connection", (socket) => {
    // 连接加入子房间
    socket.join(socket.id);
    console.log("a user connected " + socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        //某个用户断开连接的时候，我们需要告诉所有还在线的用户这个信息
        socket.broadcast.emit('user disconnected', socket.id);
    });

    //当有新用户加入，打招呼时，需要转发消息到所有在线用户。
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.broadcast.emit('need connect', {sender: socket.id, msg: data.msg});
    });

    //在线用户回应新用户消息的转发
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender : data.sender});
    });
    
    // sdp 消息的转发
    socket.on('sdp', (data) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp: ' + data.sender + ' to:' + data.to);
        socket.to(data.to).emit('sdp', {
            description: data.description,
            sender: data.sender
        });
    });

    //candidates 消息的转发
    socket.on( 'ice candidates', ( data ) => {
        console.log('ice candidates: ');
        console.log(data);
        socket.to( data.to ).emit( 'ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        });
     });

     //聊天监听
     socket.on('chat message', function(msg){
        console.log(socket.id + ': say : ' + msg);
        io.emit('chat message1',msg); //发给所有人
    });
});

