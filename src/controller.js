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
    let editor = vscode.window.activeTextEditor
    let line = editor.selection.active.line
  
    commands.initialize()
    command(editor, line)
  }
}

module.exports = {
  getCommands,
  destroy: commands.destroy
}
