var socket = require("socket.io-client")("http://abonetti.fr:3003/compile");
var Repository = require("git-cli").Repository;
var shell = require("shelljs");
var fs = require("fs");

var repositoriesRoot = "/home/pi/repositories/";

function exists(file) {
    try {
        fs.statSync(file);
    } catch (e) {
        return false;
    }
    return true;
}

function pullRepository(repository, callback) {
    var repo = new Repository(repositoriesRoot+repository.name+"/.git");
    repo.pull(callback);
}
function cloneRepository(repository, callback) {
    Repository.clone(repository.url, repositoriesRoot+repository.name, callback);
}
function launchMake(name, target) {
    var command = "make -C "+repositoriesRoot+name+" "+target+" &> log.out";
    return shell.exec(command, {silent:true}).code;
}
function readLog() {
    return shell.cat("log.out");
}

socket.on('connect', function(){
    console.log("Connected to the server");
});

socket.on('disconnect', function(){
    console.log("Disconnected from the server");
});

socket.on('compile', function (repository) {
    if(exists(repositoriesRoot+repository.name+"/.git"))
        pullRepository(repository, repositoryUpdated);
    else
        cloneRepository(repository, repositoryUpdated);

    function repositoryUpdated() {
        var hasMakefile = exists(repositoriesRoot+repository.name+"/Makefile") ||
            exists(repositoriesRoot+repository.name+"/makefile");
        var returnCode = hasMakefile ? launchMake(repository.name, "") : 0;
        var makelog = hasMakefile ? readLog() : "";

        socket.emit("compileEnd", {
            repository : repository.name,
            makefile: hasMakefile,
            code: returnCode,
            log: makelog
        });
    }
});
