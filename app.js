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
let moment = require('moment-timezone');
moment().tz("Asia/Seoul").format();

//ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//static
app.use('/static', express.static(__dirname + '/static'));
app.use('/upload', express.static(__dirname + '/upload'));
app.use('/assets', express.static(__dirname + '/assets'));

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
});

app.get('/chatting_setting', (req, res)=>{
    res.render('chatting_setting');
});

let storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'upload');
    },
    filename: (req, file, cb)=>{
        let extname = path.extname(file.originalname);
        cb(null, Date.now() + '_' + file.originalname);
    }
});
let upload_multer = multer({storage: storage});

app.post('/file_upload', upload_multer.single('image_upload'), (req,res)=>{

    //rename_filename
    fs_rename = 'upload/' +Date.now() + '_' + req.file.originalname
    fs.rename(req.file.path, fs_rename, function(err){
        if(err)throw err;
    });
    for(let key in user_list){
        if(user_list[key].id == req.body.socket_id){
            user_list[key].profile_pic = fs_rename;
            break;
        }
    }
    res.send(fs_rename);
});

let fs_rename;
let user_list = [];

class User{
    constructor(id){
        this.id = id;
        this.user_name = id;
        this.profile_pic = id;
        this.random_profile_num=Math.floor(Math.random()*20)+1;
        this.random_rgb =
            'rgb('
            + Math.round(Math.random()*255)
            + ','
            + Math.round(Math.random()*255)
            + ','
            + Math.round(Math.random()*255)
            + ')';
    }
}
let timer = 0;
// let clear_time = '';
let timerId = null;
function ten_timer() {
    // if(clear_time == '0'){
    //     timer = 0;
    //     return ;
    // }
    timerId = setTimeout(ten_timer,3000);
    timer += 10000;
    // console.log(timer);
    io.emit('ten_timer', timer);
}

//socket.io
io.on('connection', function(socket){
    //함수 정의
    function get_today() {
        //오늘날짜 생성
        let new_stamp_date = new Date();
        let stamp_year = new_stamp_date.getFullYear();
        let stamp_month = new_stamp_date.getMonth() + 1;
        let stamp_date = new_stamp_date.getDate();
        //시간 생성
        let stamp_hour = new_stamp_date.getHours();
        let stamp_minute = new_stamp_date.getMinutes();
        let stamp_second = new_stamp_date.getSeconds();
        let kor_time_now = new Date(stamp_year, stamp_month - 1, stamp_date, stamp_hour, stamp_minute, stamp_second).getTime() + (540 * 60 * 1000);
        kor_time_now = new Date(kor_time_now);
        stamp_year = kor_time_now.getFullYear();
        stamp_month = kor_time_now.getMonth() + 1;
        stamp_date = kor_time_now.getDate();
        stamp_hour = kor_time_now.getHours();
        stamp_minute = kor_time_now.getMinutes();
        let today_for_class = stamp_year + '_' + stamp_month + '_' + stamp_date;
        let today = `${stamp_year}년 ${stamp_month}월 ${stamp_date}일`;
        return {
            'stamp_year': stamp_year,
            'stamp_month': stamp_month,
            'stamp_date': stamp_date,
            'stamp_hour': stamp_hour,
            'stamp_minute': stamp_minute,
            'today_for_class': today_for_class,
            'today': today
        };
    }
    // socket.id 저장
    let socketId = socket.id;
    // User class 생성
    let new_user = new User(socket.id);
    user_list.push(new_user);
    let get_today_dic = get_today();
    socket.emit('save_info', {socket_id: socket.id, new_user: new_user});
    io.emit('enter', {socket_id: socket.id , user_list: user_list, get_today_dic: get_today_dic});
    //(io.emit는 서버에 연결되어있는 모든사람한테 연결)

    // socket.on('elapse_time', (data)=>{
    //     if(data == 'stop_elapse_time'){
    //         clearInterval(elapse);
    //         io.emit('stop_elapse_time');
    //         return;
    //     }
    //     //오늘날짜와 시간 변수
    //     let new_now_date;
    //     let now_year;
    //     let now_month;
    //     let now_date;
    //     let now_hour;
    //     let now_minute;
    //     let now_second;
    //     let now_time;
    //     function what_time_now(){
    //         new_now_date = new Date();
    //         now_year = new_now_date.getFullYear();
    //         now_month = new_now_date.getMonth()+1;
    //         now_date = new_now_date.getDate();
    //         now_hour = new_now_date.getHours();
    //         now_minute = new_now_date.getMinutes();
    //         now_second = new_now_date.getSeconds();
    //         // console.log(now_year, now_month-1, now_date, now_hour, now_minute, now_second)
    //         now_time = new Date(now_year, now_month, now_date, now_hour, now_minute, now_second);
    //         now_time = now_time.getTime() + (540 * 60 * 1000); //서버시간은 클라이언트페이지와는 다르게 영국기준으로 시간을 출력해줘서 차이나는 540분만큼 더해줬다.
    //     };
    //     //경과메세지
    //     let last_msg_time = 0;
    //     let ten_second = last_msg_time + 10000
    //     last_msg_time =  new Date(data.stamp_year, data.stamp_month, data.stamp_date, data.stamp_hour, data.stamp_minute, data.stamp_second).getTime();
    //     setTimeout(() => {
    //         console.log("첫 번째 메시지")
    //     }, 10000);
    //     if(last_msg_time > ten_second){
    //         //경과메세지 숨기기
    //         console.log('경과메세지 숨기기');
    //         last_msg_time = 0;
    //         io.emit('elapse_time_dnone');
    //     }else{
    //         //경과메세지 보내기
    //         let elapse = setInterval(function elapse(){
    //             what_time_now();
    //             let elapse_time = now_time - last_msg_time;
    //             console.log('마지막메세지: ', last_msg_time);
    //             console.log('현재시간: ', now_time);
    //             console.log('elapse_time: ', elapse_time);
    //             io.emit('elapse_time', elapse_time);
    //
    //         }, 10000);
    //     }
    // });

    socket.on('change_user_name', (data)=>{
        let before_user_name;
        for(let key in user_list){
            if(user_list[key].id == data.socket_id){
                before_user_name = user_list[key].user_name;
                user_list[key].user_name = data.user_name;
                break;
            }
        }
        socket.emit('change_user_name', {profile: data});
        io.emit('change_user_name_all', {
            profile: data,
            before_user_name: before_user_name,
        });
    });

    socket.on('change_profile_pic', (data)=>{
        io.emit('change_profile_pic', {
            profile: data,
            profile_pic: fs_rename
        });
        fs_rename = undefined;
    });

    socket.on('writing', (data)=>{
        // data == one or zero, user_name
        io.emit('writing',{socket_id: socket.id, data: data});
    })

    socket.on('stop_elapse_time', ()=>{
        clearTimeout(ten_timer);
        io.emit('stop_elapse_time');
    });


    let whisper_to;
    socket.on('send', (data)=>{
        console.log(timerId);
        if(timerId != null){
            // clear_time = '0';
            clearTimeout(timerId);
            timer = 0;
            timerId = null;
            // console.log(clear_time, 'hi');
        }
        let get_today_dic = get_today();
        // console.log(kor_time_now.getHours(), kor_time_now.getMinutes())
        // let last_msg_time = new Date(stamp_year, stamp_month-1, stamp_date, stamp_hour, stamp_minute, stamp_second);
        let stamp_time;
        if(get_today_dic.stamp_minute < 10){
            get_today_dic.stamp_minute = `0${get_today_dic.stamp_minute}`;
        }
        if(get_today_dic.stamp_hour>=12){ //오후
            if((get_today_dic.stamp_hour-12)>=10){
                stamp_time = `${get_today_dic.stamp_hour-12}:${get_today_dic.stamp_minute}pm`;
            }else{
                stamp_time = `0${get_today_dic.stamp_hour-12}:${get_today_dic.stamp_minute}pm`;
            }
        }
        else if(get_today_dic.stamp_hour>=1){ //오전
            if(get_today_dic.stamp_hour>=10){
                stamp_time = `${get_today_dic.stamp_hour}:${get_today_dic.stamp_minute}am`;
            }else{
                stamp_time = `0${get_today_dic.stamp_hour}:${get_today_dic.stamp_minute}am`;
            }
        }
        else{ //오전 12시
            stamp_time = `${get_today_dic.stamp_hour+12}:${get_today_dic.stamp_minute}am`;
        }
        let server_data = {
            socket_id: socket.id,
            user_info: data,
            whisper: whisper_to,
            stamp_time: stamp_time,
            get_today_dic: get_today_dic
        };
        timerId = setTimeout(ten_timer,3000);
        io.emit('new_msg', {server_data: server_data});
        whisper_to = undefined;
    });

    socket.on('whisper', (whisper)=>{
        whisper_to = whisper;// new_msg를 통해 전달되는 변수
    })

    socket.on('disconnect', function(){
        let exit_user = user_list.filter(i => i.id == socket.id);
        exit_user = exit_user[0].user_name;
        user_list = user_list.filter(i => i.id !== exit_user);
        io.emit('exit', {socket_id: socket.id, user_list: user_list, exit_user: exit_user});
    });
});