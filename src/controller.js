let commands = require('./coq/commands')
let vscode   = require('vscode')

let getCommands = () => {
  return [
    ['coq.next', runCommand(commands.next)],
    ['coq.prev', runCommand(commands.prev)]
  ]
}

let runCommand = (command) => {
  return (_) => {
    commands.initialize()
    command()
  }
}

module.exports = {
  getCommands,
  destroy: commands.destroy
}
