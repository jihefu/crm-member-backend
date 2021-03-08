// const easyMonitor = require('easy-monitor');
// easyMonitor('langjie');

var express = require('express');
var url = require('url');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStrore = require('connect-redis')(session);
global.CONFIG = JSON.parse(fs.readFileSync('./config.json').toString());
global.RESOURSECONFIG = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());

var index = require('./routes/index');
var log4js = require('./logs/log_start');
var mysql = require('mysql');
var request = require('request');
var domain = require('domain');

var app = express();
app.use(function (req, res, next) {
  var reqDomain = domain.create();
  reqDomain.on('error', function (err) {
      next(err);
  });
  reqDomain.run(next);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
app.use(cookieParser());
app.use(session({
    secret: 'Asecret123-',
    resave: false,
    saveUninitialized: true,
    cookie:{maxAge:30*60000},
    store: new RedisStrore({
        host:'127.0.0.1',
        port:'6379'
    })
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'downloads')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', express.static(__dirname + '/web', { index: false }));
app.use('/wxAppletManage', express.static(__dirname + '/wxAppletManage'));
app.use('/home', express.static(__dirname + '/build'));
app.use('/service', express.static(__dirname + '/public'));
app.use('/products', express.static(__dirname + '/public'));
app.use('/products', express.static(__dirname + '/downloads'));
app.use('/service/product', express.static(__dirname + '/public'));
// app.use('/service/products', express.static(__dirname + '/public'));
app.use('/m', express.static(__dirname + '/public'));
app.use('/m/admin', express.static(__dirname + '/public'));
app.use('/contract', express.static(__dirname + '/public'));
app.use('/repair', express.static(__dirname + '/public'));
app.use('/knowledge', express.static(__dirname + '/public'));
app.use('/member', express.static(__dirname + '/public'));
app.use('/open', express.static(__dirname + '/public'));
app.use('/retail', express.static(__dirname + '/public'));
app.use('/retail/vir', express.static(__dirname + '/public'));

// app.use('/', index);
require('./routes/index')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

process.on('uncaughtException', function (err) {
  LOG(err.stack);
});
//监听Promise没有被捕获的失败函数
process.on('unhandledRejection',function(err,promise){
    LOG(err.stack);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('./pages/tip',{
      tip: err
  });
  if (err.status !== 404) {
    LOG(err.stack);
  }
});

var pool = mysql.createPool({  
    host: CONFIG.mysql_host,  
    user:CONFIG.mysql_user,
    password:CONFIG.mysql_password,
    port:'3306',
    database:'lj_node'
});
var poolRepair = mysql.createPool({  
    host: 'www.langjie.com',  
    user:'root',
    password:'437612langjie',
    port:'3306',
    database:'lj_service'
});
global.CON=function(sql,callback){
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            // console.log('succeed');
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
}; 
global.CONRE=function(sql,callback){
    poolRepair.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            // console.log('succeed');
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
}; 
global.CONINSERT=function(sql,values,callback){
    pool.getConnection(function(err,conn){ 
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,values,function(qerr,vals,fields){  
                conn.release();    
                callback(qerr,vals,fields);  
            });
        }  
    });  
}; 
global.CONROLLBACK = function(cb){
    pool.getConnection(function(err,conn){  
        if(err){  
            cb(err);  
        }else{  
            cb(null,conn);  
        }  
    }); 
}

global.DIRNAME = __dirname;

global.LOG = function(info){
  log4js.getLogger('log_file').debug(info);
  console.log(info);
}
global.ROUTE = function(url){
    return 'http://'+CONFIG.web_host+':'+CONFIG.web_port+'/'+url;
}
//常用
global.ROUTER = function(req){
    if(req){
        var deviceAgent = req.headers['user-agent'].toLowerCase();  
        var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
        if(agentID){
            return 'http://'+CONFIG.web_host+':'+CONFIG.web_port+'/m';
        }else{
            return 'http://'+CONFIG.web_host+':'+CONFIG.web_port;
        }
    }else{
        return 'http://'+CONFIG.web_host+':'+CONFIG.web_port;
    }
}
global.USERAGENT = function(req){
    var deviceAgent = req.headers['user-agent'].toLowerCase();  
    var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
    if(agentID){
        return 'm';
    }else{
        return 'pc';
    }
}
global.SEND = function(res,code,msg,data){
  try{
    var o = {
      'code': code,
      'msg':msg,
      'data':data
    };
    res.send(JSON.stringify(o));
  }catch(e){
    LOG(e);
  }
}

global.RESULT = function(code,msg,data){
  try{
    var o = {
      'code': code,
      'msg':msg,
      'data':data
    };
    return o;
  }catch(e){
    LOG(e);
  }
}
global.DATETIME = function(t){
  if(t){
    var date = new Date(t);
  }else{
    var date = new Date();
  }
  var yy = date.getFullYear();
  var MM = date.getMonth()+1;
  var dd = date.getDate();
  if(MM<10) MM ='0'+MM;
  if(dd<10) dd ='0'+dd;
  var time = yy + '-' + MM + '-' + dd;
  return time;
}
global.TIME = function(t){
  if(t){
    var date = new Date(t);
  }else{
    var date = new Date();
  }
  var yy = date.getFullYear();
  var MM = date.getMonth()+1;
  var dd = date.getDate();
  if(date.getHours()<10){
    var HH = '0'+date.getHours();
  }else{
    var HH = date.getHours();
  }
  if(date.getMinutes()<10){
    var mm = '0'+date.getMinutes();
  }else{
    var mm = date.getMinutes();
  }
  if(date.getSeconds()<10){
    var ss = '0'+date.getSeconds();
  }else{
    var ss = date.getSeconds();
  }
  if(MM<10) MM ='0'+MM;
  if(dd<10) dd ='0'+dd;
  var time = yy + '-' + MM + '-' + dd +' '+HH+':'+mm+':'+ss;
  return time;
}
global.OPENID = function(code,cb){
    var appid="wx0f012ab2b8db902d";
    var appsecret="e9f1f204691863715cc18e9e0439c069";
    var cdurl="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+appid+"&secret="+appsecret+"&code="+code+"&grant_type=authorization_code";
    request.get(cdurl,function(err,response,body){
        var bodys=JSON.parse(body);
        if(bodys.errcode){
            cb('fail');
        }else{
            cb(bodys.openid);
        }
    })
}
global.TIP = function(res,tip){
    res.render('./pages/tip',{
      tip: tip
    });
}
global.CHECKSESSION = function(req,res,key,cb){
    if(req.session[key]){
        cb(200);
    }else{
        var params = url.parse(req.url,true).query;
        var code = params.code;
        if(code){
            OPENID(code,function(open_id){
                if(open_id=='fail'){
                    res.render('./pages/err');
                }else{
                    req.session[key] = open_id;
                    cb(100);
                } 
          });
        }else{
          cb(-1);
        }
    }
}

module.exports = app;
