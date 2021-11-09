const express = require('express');
const app = express();
const port =8020;
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
let fs =require('fs');
const { extname } = require('path/posix');

//ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//static
app.use('/static', express.static(__dirname + '/static'));
app.use('/upload', express.static(__dirname + '/upload'));

//mysql
const conn = mysql.createConnection({
    user: 'root',
    password: 't5hgu2!!',
    database: 'rocket_chat'
});

//get and post
http.listen(port, ()=>{
    conn.connect((err)=>{
        if(err) console.log(err);
        else console.log('Hi I\'m in')
    })
});

app.get('/chatting', function(req,res){
    res.render('chatting');
    // res.render('chatting', {profile_pic: profile_pic});
});

app.get('/chatting_setting', (req, res)=>{
    res.render('chatting_setting');
});

let storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'upload');
    },
    filename: (req, file, cb)=>{
        // console.log(file);
        let extname = path.extname(file.originalname);
        cb(null, Date.now() + '_' + file.originalname);
    }
});
let upload_multer = multer({storage:storage});

app.post('/chatting', upload_multer.single('data'), (req,res)=>{
    //rename_filename
    console.log(upload_multer.single('data'));
    fs.rename(req.file.path, 'upload/' +Date.now() + '_' + req.file.originalname, function(err){
        if(err)throw err;
        console.log('file renamed!');
    });
});

let user_list = [];

//socket.io
io.on('connection', function(socket){
    socket.emit('saveId', socket.id); 
    user_list.push(socket.id);
    // console.log('유저추가리스트:' + user_list);
    io.emit('enter', {socket_id: socket.id + '님 입장하셨습니다.', user_list: user_list});
    //io.emit서버에 연결되어있는 모든사람한테 연결

    socket.on('send', (msg)=>{
        console.log(`내용${msg}, 메세지 보낸 사람은 ${socket.id}`);
        io.emit('new_msg',{socket_id: socket.id, msg: msg});
    });

    socket.on('disconnect', function(){
        // console.log('유저삭제리스트:' + user_list.filter(v => {return v !== socket.id;}));
        user_list = user_list.filter(v => {return v !== socket.id;});
        console.log('유저삭제리스트:' + user_list);
        io.emit('exit', {socket_id: socket.id + '님 퇴장하셨습니다.', user_list: user_list});
    });
});