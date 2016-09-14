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

let next = () => {
  let editor = vscode.window.activeTextEditor
  var line = editor.selection.active.line
  let cmd = editor.document.lineAt(line).text

  let displaySingleGoal = (goal) => {
    let hypos = goal.list
    let subgoal = goal.string
    if (hypos.string) {
      if (hypos.string instanceof Array) {
        let buf = []
        hypos.string.forEach((h) => {
          buf.push(h)
        })
        outputChannel.appendLine(buf.join('\n'))
      } else {
        outputChannel.appendLine(hypos.string)  
      }
    }
    outputChannel.appendLine('-'.repeat(100))        
    outputChannel.appendLine(subgoal[1])
  }

  let successHandler = (arg) => {
    outputChannel.clear()
    outputChannel.show()
    state[line] = arg.stateId

    model.goals().subscribe((arg) => {
      console.log("goal => " + JSON.stringify(arg.goal))      
      if (arg.goal instanceof Array) {
        let subgoal1 = arg.goal[0]
        outputChannel.appendLine(`${ arg.goal.length } subgoals, subgoal 1 (ID ${ subgoal1.string[0] })\n`)
        displaySingleGoal(subgoal1)
        let buf = []
        for (var i = 1; i < arg.goal.length; i++){
          var subgoal = arg.goal[i]
          buf.push(`subgoal ${ i + 1 } (ID ${ subgoal.string[0] }) is:`)
          buf.push(subgoal.string[1])
        }
        outputChannel.appendLine('')
        outputChannel.appendLine(buf.join('\n'))
      } else {
        if (arg.goal) {
          outputChannel.appendLine(`1 subgoals, subgoal 1 (ID ${ arg.goal.string[0] })\n`)    
          displaySingleGoal(arg.goal)
        } else {
          outputChannel.appendLine('No more subgoals.')
        }
      }
    }, displayErrors)
  }

  new Promise((resolve, reject) => {
    model.add(cmd, line).subscribe(successHandler, displayErrors)
    resolve()
  }).then(function () {
  }).catch(function () {
  })
}

let displayErrors = (err) => {
  outputChannel.clear()
  outputChannel.show()
  outputChannel.appendLine(err.message)
}

let destroy = () => {
  if(model != null) model.stop()
}

module.exports = {
  initialize,
  next,
  destroy
}
