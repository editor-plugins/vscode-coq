let commands = require('./coq/commands')
let vscode   = require('vscode')

let getCommands = () => {
  return [
    ['coq.next', runCommand(commands.next)],
    ['coq.prev', runCommand(commands.prev)],
    ['coq.to-cursor', runCommand(commands.toCursor)]
  ]
}

let runCommand = (command) => {
  return (_) => {
    let editor = vscode.window.activeTextEditor
    let line = editor.selection.active.line
  
    command(editor, line)
  }
}

module.exports = {
  getCommands,
  initialize : commands.initialize,
  destroy: commands.destroy
}
