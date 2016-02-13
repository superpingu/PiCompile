var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var logs = require('./logs.js');

app.use(express.static(path.join(__dirname, 'public')));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var server = app.listen(3003, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('MotorTest listening at http://%s:%s', host, port);
});

// connection to compile server
var io = require('socket.io')(server);
var compileSocket = null;

io.of('/compile').on('connection', function (socket) {
    console.log('New compile server connected');
    compileSocket = socket;

    socket.on('compileEnd', function(data) {
        logs.processCompileResult(data);
    });
});

// HTTP API
app.post('/push', function(req, res) {
    // debug
    console.dir(req.body);
    // check the POST looks like something github would send
    if(req.body && req.body.repository) {
        // compile only if the last commit doesn't start with 'WIP' and if compilation is enabled
        if(logs.allowsCompile(req.body) && compileSocket) {
            logs.logPush(req.body);
            compileSocket.emit('compile', {
                name: req.body.repository.name,
                url: req.body.repository.clone_url
             });
        }
    } else {
        console.err("Wrong post body :");
        console.dir(req.body);
    }
});

app.get('/repository/:name', function(req, res) {
    // TODO
    res.render('index', {});
});
app.get('/', function(req, res) {
    // TODO
    res.render('index', {});
});
