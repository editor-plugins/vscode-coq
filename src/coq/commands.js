let CoqModel = require('./model')
let vscode     = require('vscode')

let model = null
let outputChannel = vscode.window.createOutputChannel('Coq')
let state = {}

let initialize = () => {
  if (!model) {
    model = new CoqModel()
  }
}

let showLoading = () => {
  outputChannel.clear()
  outputChannel.show()
  outputChannel.append("loading...")
}

let next = () => {
  console.log("next!")
  let editor = vscode.window.activeTextEditor
  var line = editor.selection.active.line
  let cmd = editor.document.lineAt(line).text

  let successHandler = (arg) => {
    outputChannel.clear()
    outputChannel.show()
    state[line] = arg.stateId
    
    model.goals().subscribe((arg) => {
      console.log("goal => " + arg.goal)
    }, displayErrors)
  }

  new Promise((resolve, reject) => {
    model.add(cmd, line).subscribe(successHandler, displayErrors)
    showLoading()
    resolve()
  }).then(function () {
  }).catch(function () {
  })
}

let displayErrors = (err) => {
  outputChannel.clear()
  outputChannel.show()
  outputChannel.appendLine("error")
}

let destroy = () => {
  if(model != null) model.stop()
}

module.exports = {
  initialize,
  next,
  destroy
}
