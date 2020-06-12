var JPush = require("./lib/JPush/JPushAsync.js")
var client = JPush.buildClient('7440b0b2cfd8505748743939', '2212fe937c3f5af9eb96b2b0')
var express = require('express');
var app = express();
var router = express.Router();
var http = require('http');
var request = require('request-promise');
var https = require('https');
var fs = require('fs');
var cors = require('cors');
var axios = require('axios');
var _ = require('lodash');
var moment = require('moment');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  cert: fs.readFileSync("../cert.pem"),
  key: fs.readFileSync("../key.pem"),
  passphrase: "YYY"
})

var now = moment().locale('zh-cn').format('YYYY-MM-DD');
const url = 'https://api22.kenta.cn:8892/type=getcollecteddata?id=5e8ee6965371f15dd4a99720'
var pushurl = "https://api10.kenta.cn:11011/jpush_sendTag"
var callAjax = async (url) => {   
    url = encodeURI(url);
    var agent = new https.Agent({ rejectUnauthorized: false });
    var response = await axios.get(url,{ httpsAgent: agent });
    var data = response.data;
  var newdata=[]
  _.map(data,function(n){
    newdata.push(n.collectedData)
  })  
  //   console.log('newdata',newdata);   
  _.map(newdata,function(n){
    if(moment(n.限期).isBefore(now)&&n.状态!='完成'){
      console.log(n.限期,n.状态,"超时")
      var obj={
        tag:[n.主要负责人],
        title:"系统组任务",
        msg:n.标题+"超时"
      }
      axios.get('https://api10.kenta.cn:11011/jpush_sendTag',{params:obj,httpsAgent:httpsAgent})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.log(error);
  });
      // pushAjax(pushurl,obj)
    }
  })  
  };
callAjax(url)
// var int=setInterval(function(){
  // callAjax(url)
  // },86400000);
 
  var pushAjax = async (pushurl,obj) => {   
      pushurl = encodeURI(pushurl);
      var agent = new https.Agent({ rejectUnauthorized: false });
      var response = await axios.get(pushurl,{params:obj},{ httpsAgent: agent });
      console.log("请求返回",response )
    };
