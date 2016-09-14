let cp           = require('child_process')
let EventEmitter = require('events').EventEmitter
let vscode       = require('vscode')
let xml          = require('../xml')

class Coqtop extends EventEmitter {
  constructor() {
    super()
    this.process = null
  }

  start() {
    if ((this.process == null) || !this.process.connected) {
      let pathToCoqtop = 'coqtop'
      let params = [
        '-ideslave',
        '-main-channel',
        'stdfds',
        '-async-proofs',
        'on'
      ]
      let options = {}
      
      this.process = cp.spawn(pathToCoqtop, params, options)

      this.process.on('error', this.error)
      this.process.on('exit', this.exited)
      this.process.on('close', this.exited)
      this.process.on('disconnect', this.exited)

      if (this.process.pid) {
        this.process.stdout.setEncoding('utf8').on('data', (data) => { this.stdout(data) })
      }
    }
  }

  send(cmd) {
    return this.process.stdin.write(cmd)
  }

  stop() {
    if (this.process != null) {
      this.process.kill()
    }
  }

  error(error) {
    let msg = error.code == 'ENOENT' 
      ? "Couldn't find coqtop executable at \"" + error.path + "\""
      : error.message + '(' + error.code + ')'
    vscode.window.showErrorMessage(msg)
  }

  exited(code, signal) {
    if(signal == "SIGTERM") {
      let msg = "coqtop was closed"
      vscode.window.showInformationMessage(msg)
    } else {
      let short = "coqtop was closed or crashed"
      let long = signal
        ? "It was closed with the signal: " + signal
        : "It (probably) crashed with the error code: " + code
      vscode.window.showErrorMessage(short + " " + long)
    }
  }

  stdout(data) {
    let json = xml.parse(data.trim())
    this.emit('message', json)
  }
}

module.exports = Coqtop
