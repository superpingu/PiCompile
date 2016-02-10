var socket = require("socket.io-client")("http://abonetti.fr/picompile");
var git = require("git-cli");
var shell = require("shelljs");
var fs = require("fs");

var repositoriesRoot = "~/compileServer/";

function exists(file) {
    try {
        fs.statSync(file);
    } catch (e) {
        return false;
    }
    return true;
}

function pullRepository(name) {
    var repo = new Repository(repositoriesRoot+name+"/.git");
    repo.log(function(err, logs) {

    });
}
function cloneRepository(name) {

}
function launchMake(name) {

}
function readLog(name) {

}

socket.on('connect', function(){
    console.log("Connected to the server");
});

socket.on('disconnect', function(){
    console.log("Disconnected from the server");
});

socket.on('compile', function (repository) {
    if(exists(repositoriesRoot+repository.name+"/.git"))
        pullRepository(repository);
    else
        cloneRepository(repository);

    var hasMakefile = exists(repositoriesRoot+repository.name+"/Makefile") ||
        exists(repositoriesRoot+repository.name+"/makefile");
    var returnCode = hasMakefile ? launchMake(repository) : 0;

    socket.emit("compileEnd", {
        repository : repository.name,
        makefile: hasMakefile,
        code: returnCode,
        log: readLog(repository.name)
    });
});
