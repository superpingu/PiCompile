var fs = require("fs");

function repositoryExists(name) {
    try {
        fs.statSync(name);
    } catch (e) {
        return false;
    }
    return true;
}
console.log(repositoryExists("/Users/arnaud/Programmation/RobotDriver/Makefile"));

var Repository = require("git-cli").Repository;

var repo = new Repository("/Users/arnaud/Programmation/RobotDriver/.git");

/*repo.status(function(err, status) {
    console.dir(status);
});*/
