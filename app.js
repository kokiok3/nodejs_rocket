const express = require('express');
const app = express();
const port = 8020;
const http = require('http').Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
let fs = require('fs');
const Console = require("console");
// const { extname } = require('path/posix');

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
    // database: 'rocket_chat'
});

//get and post
http.listen(port, ()=>{
    conn.connect((err)=>{
        if(err) console.log(err);
        else console.log('Hi I\'m in');
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

app.post('/file_upload', upload_multer.single('image_upload'), (req,res)=>{
    // console.log('요청바디: ', req);
    // console.log('응답: ', res);
    // console.log('바디: ', req.body);

    //rename_filename
    fs_rename = 'upload/' +Date.now() + '_' + req.file.originalname
    fs.rename(req.file.path, fs_rename, function(err){
        if(err)throw err;
        console.log('file renamed!: ' , fs_rename);
    });
    res.send(fs_rename);
});

let fs_rename;
let user_list = [];

class User{
    constructor(id){
        this.id=id;
        this.random_profile=Math.floor(Math.random()*20);
    }
    // random_profile(num){
    //     this.random_profile=
    // }
}

//socket.io
io.on('connection', function(socket){
    // socket.id 저장
    socket.emit('saveId', socket.id);
    // User class 생성
    let new_user = new User(socket.id);
    user_list.push(new_user);
    console.log('접속유저', user_list);
    // user_list.push(socket.id);
    // console.log('유저추가리스트:' + user_list);
    io.emit('enter', {socket_id: socket.id , user_list: user_list});
    //io.emit서버에 연결되어있는 모든사람한테 연결

    let whisper_to;
    socket.on('send', (msg)=>{
        // console.log(`내용${msg}, 메세지 보낸 사람은 ${socket.id}`);
        console.log('send!!!!:', msg);
        io.emit('new_msg',{socket_id: socket.id, msg: msg, whisper: whisper_to});
        whisper_to = undefined;
    });

    socket.on('whisper', (whisper)=>{
        console.log('whisper_op:', whisper);
        whisper_to = whisper;
    })

    socket.on('disconnect', function(){
        user_list = user_list.filter(i => i.id !== socket.id);
        console.log('남은 유저:', user_list);
        io.emit('exit', {socket_id: socket.id, user_list: user_list});
    });
});