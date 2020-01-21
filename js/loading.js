const ora = require('ora')
const chalk = require('chalk')

let ins

function start(title) {
    if (ins) return done(title);
    ins = ora({
        text: chalk.blue(`[${title}]`),
        stream: process.stdout
    }).start();
}

function done(title) {
    ins && ins.succeed()
    ins = null
    if (title) start(title)
}

function fail() {
    ins && ins.fail()
}

function stop() {
    ins && ins.stop()
    ins = null
}

module.exports = {
    start,
    stop,
    done,
    fail
}