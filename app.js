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
let upload_multer = multer({storage: storage});

app.post('/file_upload', upload_multer.single('image_upload'), (req,res)=>{
    // console.log('요청바디: ', req);
    // console.log('응답: ', res);
    console.log('바디: ', req.body);

    //rename_filename
    fs_rename = 'upload/' +Date.now() + '_' + req.file.originalname
    fs.rename(req.file.path, fs_rename, function(err){
        if(err)throw err;
        // console.log('file renamed!: ' , fs_rename);
    });
    for(let key in user_list){
        // console.log(user_list[key].id == req.body.socket_id);
        if(user_list[key].id == req.body.socket_id){
            user_list[key].profile_pic = fs_rename;
            console.log('profile picture add:', user_list);
            break;
        };
    }
    res.send(fs_rename);
    // res.send('success');
});

let fs_rename;
let user_list = [];

class User{
    constructor(id){
        this.id=id;
        this.random_profile_num=Math.floor(Math.random()*20)+1;
        this.user_name=id;
        this.random_rgb =
            'rgb('
            + Math.round(Math.random()*255)
            + ','
            + Math.round(Math.random()*255)
            + ','
            + Math.round(Math.random()*255)
            + ')';
        this.profile_pic;
    }
}

//socket.io
io.on('connection', function(socket){
    // socket.id 저장
    let socketId = socket.id;
    // User class 생성
    let new_user = new User(socket.id);
    user_list.push(new_user);
    socket.emit('save_info', {socket_id: socket.id, new_user: new_user});
    io.emit('enter', {socket_id: socket.id , user_list: user_list});
    //(io.emit는 서버에 연결되어있는 모든사람한테 연결)

    socket.on('change_profile', (data)=>{
        let before_user_name;
        console.log('114:', data);
        for(let key in user_list){
            if(user_list[key].id == data.socket_id){
                before_user_name = user_list[key].user_name;
                user_list[key].user_name = data.user_name;
                break;
            }
        }
        console.log(2);
        socket.emit('change_user_name', {profile: data});
        io.emit('change_profile', {profile: data, before_user_name: before_user_name});
    });

    let whisper_to;
    socket.on('send', (data)=>{
        // console.log(`내용${msg}, 메세지 보낸 사람은 ${socket.id}`);
        // console.log('send!!!!:', msg);
        io.emit('new_msg',{socket_id: socket.id, user_info: data, whisper: whisper_to});
        whisper_to = undefined;
    });

    socket.on('whisper', (whisper)=>{
        console.log('whisper_op:', whisper);
        whisper_to = whisper;
    })

    socket.on('disconnect', function(){
        user_list = user_list.filter(i => i.id !== socket.id);
        // console.log('남은 유저:', user_list);
        io.emit('exit', {socket_id: socket.id, user_list: user_list});
    });
});