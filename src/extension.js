let vscode     = require('vscode')
let controller = require('./controller')

function activate(context) {
  controller.getCommands().forEach(([key, value]) => {
    let disposable = vscode.commands.registerCommand(key, value)
    context.subscriptions.push(disposable)
  })
}
exports.activate = activate

function deactivate() {
  controller.destroy()
}
exports.deactivate = deactivate