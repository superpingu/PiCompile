var jsonfile = require('jsonfile');

function readLogs() {
    return jsonfile.readFileSync("./logs.json");
}
function saveLogs() {
    jsonfile.writeFile("./logs.json", logs, function(err) {
        console.err("Error writing logs : " + err);
    });
}
var logs = readLogs();

function logPush(push) {
    var repo = push.repository.name;
    if(typeof(logs[repo]) === "undefined")
        logs[repo] = {state: "OK"};
    logs[repo].commit_msg = push.head_commit.message;
    logs[repo].commit_author = push.head_commit.author.name;
    logs[repo].url = push.repository.clone_url;
    saveLogs();
}

function allowsCompile(push) {
    // test if last commit is marked as WIP (work in progress, likely not to compile)
    var isWIP = push.head_commit.message.trim().startsWith('WIP');
    if(isWIP || (logs[push.repository.name] && logs[push.repository.name].state === "NO"))
        return false;
    else
        return true;
}

function processCompileResult(results) {
    if(typeof(logs[results.repository]) === "undefined") {
        console.log('compilation results : unknown repository ' + results.repository);
        return;
    }
    if(!results.hasMakefile) {
        logs[results.repository].state = "nomake";
    } else {
        logs[results.repository].state = (results.code === 0) ? "OK" : "KO";
        logs[results.repository].log = results.log;
    }

    saveLogs();
}
function getLog(repository) {
    var log = logs[repository];
    if(typeof(log) === "undefined")
        return null;
    else {
        log.name = repository;
        return log;
    }
}
function setState(repository, state) {
    if(logs[repository] === null)
        return;
    logs[repository].state = state;
    saveLogs();
}

module.export = {
    savePush: logPush,
    allowsCompile: allowsCompile,
    processCompileResult: processCompileResult,
    get: getLog,
    setState: setState,
    getAll: function() { return logs; }
};
