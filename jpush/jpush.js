var JPush = require("./lib/JPush/JPushAsync.js")
var client = JPush.buildClient('key', 'key2')
var express = require('express');
var app = express();
var router = express.Router();
var http = require('http');
var request = require('request-promise');
var https = require('https');
var fs = require('fs');
var cors = require('cors');
app.use(cors());

//easy push
var options = {
    key: fs.readFileSync('../key.pem'),
    cert: fs.readFileSync('../cert.pem') ,
    secure:true,
    reconnect: true,
    rejectUnauthorized : false
};

app.get('/jpush_sendAll',function(req, res){
    console.log("请求",req.query)
    var msg=req.query.msg
    var title=req.query.title
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    client.push().setPlatform('ios', 'android')
        .setAudience(JPush.ALL)
        .setNotification('Hi, JPush', JPush.ios(msg), JPush.android(msg,title, 1))
        .setMessage(msg)
        .setOptions(null, 60)
        .send()
        .then(function(result) {
            console.log(result)
            res.jsonp(result)
        }).catch(function(err) {
            console.log(err)
        })
});

app.get('/jpush_sendAlias',function(req, res){
    console.log("请求",req.query)
    var alias=req.query.alias
    var msg=req.query.msg
    var title=req.query.title
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    client.push().setPlatform('ios', 'android')
        .setAudience(JPush.alias(...alias))
        .setNotification('Hi, JPush', JPush.ios(msg), JPush.android(msg,title, 1))
        .setMessage(msg)
        .setOptions(null, 60)
        .send()
        .then(function(result) {
            console.log(result)
            res.jsonp(result)
        }).catch(function(err) {
            console.log(err)
        })
});

app.get('/jpush_sendTag',function(req, res){
    console.log("请求",req.query)
    var tag=req.query.tag
    var msg=req.query.msg
    var title=req.query.title
    res.setHeader("Access-Control-Allow-Origin", "*"); 
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    client.push().setPlatform('ios', 'android')
        .setAudience(JPush.tag(...tag))
        .setNotification('Hi, JPush', JPush.ios(msg), JPush.android(msg,title, 1))
        .setMessage(msg)
        .setOptions(null, 60)
        .send()
        .then(function(result) {
            console.log(result)
            res.jsonp(result)
        }).catch(function(err) {
            console.log(err)
        })
});





var arr_exe_update={},arr_exe_update_http={};
var server = https.createServer(options,app);
server.listen(11011,function(){
    console.log("服务运行在11011")
});