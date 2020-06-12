var https = require('https');
var _ = require("lodash");
var moment = require("moment");
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var axios = require("axios");
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors());

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  secure: true,
  reconnect: true,
  rejectUnauthorized: false
};
// 查询所有货品代号
app.get('/getAllcode',function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
 
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(globalBaseJson.货品代号列表));
});
// 查询单一货品代号数据
app.get('/searchCode',function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.log("请求",req.query.code)
  let seachCode =req.query.code
  var str=seachCode.substr(0, 12)
  res.end(JSON.stringify(globalBaseJson.查询货品代号[str]));
});



var server = https.createServer(options,app);
server.listen(11013,function(){
    console.log("服务运行在11013")
});

var callevent = new EventEmitter();
callevent.setMaxListeners(10000);


var notInitJson = { "status": "waiting Init" };
var globalBaseJson = {};

var baseCoversion = {
  'QuerySa': { 'type': 'baseurl', 'url': 'https://api10.kenta.cn:11000/test?name=QuerySa', 'intervalrequest': true, 'intervaltime': 86400000 },
  'QuerySsb': { 'type': 'baseurl', 'url': 'https://api10.kenta.cn:11000/test?name=QuerySsb', 'intervalrequest': true, 'intervaltime': 86400000 },
  '货品代号列表':{'type':'basefunc', 'relatedFunction':"makeKeys", "baseNeed":['QuerySa']},
  '查询货品代号':{'type':'basefunc', 'relatedFunction':"makeCode", "baseNeed":['QuerySa','QuerySsb','货品代号列表']},   
}


function ajaxInterval(url, name, type, local, time) {
  setInterval(function () {
    getAjaxResult(url, name, type, local)
  }, time);
}
var getAjaxResult = async (url, name, type, local) => {
  url = encodeURI(url);

  if (type == 'baseurl') {
    try {
      var response;
      var agent = new https.Agent({ rejectUnauthorized: false });
      response = await axios.get(url, { httpsAgent: agent });
      var data = response.data;
      globalBaseJson[name] = data;
      console.log(name + '组好了');
      callevent.emit(name + '组好了');
    } catch (error) {
      console.log('eror url here?', error, url);
    }
  } else {
    console.log(url, name)
    eval(url + '()');
  }
};
var callAjax = async (url) => {
  url = encodeURI(url);
  var agent = new https.Agent({ rejectUnauthorized: false });
  var response = await axios.get(url, { httpsAgent: agent });
  var data = response.data;
  console.log('data', data);
};


/*****************************
  初始化
*****************************/

function init() {
  _.map(baseCoversion, function (value, key) {
    if (value.type == 'baseurl') {
      //把key注册在globalBaseJson
      globalBaseJson[key] = notInitJson;
      //初始化取baseurl数据
      getAjaxResult(value.url, key, value.type, value.localsource);
      //需要循环的开启循环      
      if (value.intervalrequest) {
        ajaxInterval(value.url, key, value.type, value.localsource, value.intervaltime);
      };
      //监听手工更新      
      callevent.on(key + '重组', function () { getAjaxResult(value.url, key, value.type, value.localsource) });
    } else if (value.type == 'basefunc') {
      //把key注册在globalBaseJson
      globalBaseJson[key] = notInitJson;
      //监听baseNeed
      _.forEach(value.baseNeed, function (n) {
        callevent.on(n + '组好了', function () { eval(value.relatedFunction + '()') });
      });

      //监听手工更新
      callevent.on(key + '重组', function () { eval(value.relatedFunction + '()') });
    }
  });
  callevent.emit('完成globalBaseJson结构初始化');
};

init();

/****************
 * 组基础数据
 */

// 货品代号列表
function makeKeys() {
  console.log('货品代号列表 检查是否满足baseNeed');
  //检查是否满足baseNeed
  var CompleteCount = 0;
  _.map(baseCoversion.货品代号列表.baseNeed, function (n) {
    if (globalBaseJson[n] == notInitJson) {
      console.log(n, '没有数据');
    } else {
      CompleteCount++;
    }
  });
  if (CompleteCount < baseCoversion.货品代号列表.baseNeed.length) {
    console.log('货品代号列表 不满足baseNeed', CompleteCount + '/' + baseCoversion.货品代号列表.baseNeed.length);
    return false;
  } else {
    var numAlljson = _.groupBy(globalBaseJson.QuerySa, "货品代号")
    var delArr = []
    _.map(numAlljson, (n, leiName) => {
      if (leiName.substr(0, 4) == 'K-CP' || leiName.substr(0, 4) == 'K-YZ') {
        delArr.push(leiName)
      }
    })
    let codeArr=delArr
    _.map(delArr, (leiName) => {
      var str = leiName.substr(0, 12)
      if( codeArr.indexOf(str) == -1){
        codeArr.push(str)
      }
    })
    globalBaseJson.货品代号列表 = codeArr; console.log("货品代号列表组好了")
    callevent.emit('货品代号列表组好了');
  }
}

// 查询货品代号
function makeCode() {
  console.log('查询货品代号 检查是否满足baseNeed');
  //检查是否满足baseNeed
  var CompleteCount = 0;
  _.map(baseCoversion.查询货品代号.baseNeed, function (n) {
    if (globalBaseJson[n] == notInitJson) {
      console.log(n, '没有数据');
    } else {
      CompleteCount++;
    }
  });
  if (CompleteCount < baseCoversion.查询货品代号.baseNeed.length) {
    console.log('查询货品代号 不满足baseNeed', CompleteCount + '/' + baseCoversion.查询货品代号.baseNeed.length);
    return false;
  } else {
    var searchCodeObj={},grouparr=[]
    _.map(globalBaseJson.货品代号列表,(code)=>{
      if(code.length==12){
        grouparr.push(code)
        searchCodeObj[code]={sa:[],ssb:[]}
      }
    })
    let numAlljson = _.groupBy(globalBaseJson.QuerySa, "货品代号")
    _.map(grouparr,(code)=>{
      _.map(numAlljson,(n,key)=>{
        var Compared=key.substr(0, 12)
        if(code==Compared){
          searchCodeObj[code]['sa'].push(n)
        }
      })
    })
    let thAlljson = _.groupBy(globalBaseJson.QuerySsb, "成品代号")
    _.map(grouparr,(code)=>{
      _.map(thAlljson,(n,key)=>{
        var Compared=key.substr(0, 12)
        if(code==Compared){
          searchCodeObj[code]['ssb'].push(n)
        }
      })
    })
    globalBaseJson.查询货品代号=searchCodeObj
    console.log("代号查询组好了,缓存执行完毕")
  }
}

