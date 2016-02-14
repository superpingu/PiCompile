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

  console.log('PiCompile listening at http://%s:%s', host, port);
});

// connection to compile server
var io = require('socket.io')(server);
var compileSocket = null;

io.of('/compile').on('connection', function (socket) {
    console.log('New compile server connected');
    compileSocket = socket;

    socket.on('compileEnd', function(data) {
        console.log("Received compilation results");
        logs.processCompileResult(data);
    });
});

function startCompilation(repository, target) {
    var log = logs.get(repository);
    if(log === null || compileSocket === null)
        return;
    compileSocket.emit('compile', {
        name: repository,
        url: log.url,
        target: target
    });
    logs.setState(repository, "compiling");
}
// HTTP API
app.post('/pcp/push', function(req, res) {
    // debug
    console.log("Received new push data");
    // check the POST looks like something github would send
    if(req.body && req.body.repository) {
        // compile only if the last commit doesn't start with 'WIP' and if compilation is enabled
        if(logs.allowsCompile(req.body)) {
            logs.savePush(req.body);
            startCompilation(req.body.repository.name, "");
        }
    } else {
        console.log("Wrong post body :");
        console.dir(req.body);
    }
    res.sendStatus(200);
});

app.get('/pcp/repository/:name', function(req, res) {
    var log = logs.get(req.params.name);
    if(log === null)
        res.sendStatus(404);
    else
        res.render('repository', log);
});
app.get('/pcp/repository/:name/enable', function(req, res) {
    logs.setState(req.params.name, "OK");
    startCompilation(req.params.name, "");
    res.redirect('/pcp/repository/'+req.params.name);
});
app.get('/pcp/repository/:name/disable', function(req, res) {
    logs.setState(req.params.name, "NO");
    res.redirect('/pcp/repository/'+req.params.name);
});
app.get('/pcp/repository/:name/install', function(req, res) {
    startCompilation(req.params.name, "install");
    res.redirect('/pcp/repository/'+req.params.name);
});
app.get('/pcp/repository/:name/clean', function(req, res) {
    startCompilation(req.params.name, "clean");
    res.redirect('/pcp/repository/'+req.params.name);
});
app.get('/pcp/', function(req, res) {
    res.render('index', {repositories: logs.getAll()});
});
