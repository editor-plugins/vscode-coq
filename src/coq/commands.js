let CoqModel = require('./model')
let vscode   = require('vscode')

let model = null
let outputChannel = vscode.window.createOutputChannel('Coq')
let state = {}

let proofDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(114,213,114,0.3)'
})

let initialize = () => {
  if (!model) {
    model = new CoqModel()
  }
}

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

let successHandler = (arg, editor, newPosition) => {
  let newSelection = new vscode.Selection(newPosition, newPosition)
  editor.selection = newSelection

  outputChannel.clear()
  outputChannel.show()

  let lines = Object.keys(state)

  editor.setDecorations(proofDecorationType, [])

  let decorations = lines.map((line) => {
    let l = parseInt(line)
    let start = new vscode.Position(l, 0)
    let end = new vscode.Position(l + 1, 0)
    return {
      range: new vscode.Range(start, end)
    }
  })
  editor.setDecorations(proofDecorationType, decorations)

  model.goals().subscribe((arg) => {
    outputChannel.clear()
    outputChannel.show()
    if (arg.type == 'goal') {
      if (arg.goal instanceof Array) {
        let subgoal1 = arg.goal[0]
        outputChannel.appendLine(`${ arg.goal.length } subgoals, subgoal 1 (ID ${ subgoal1.string[0] })\n`)
        displaySingleGoal(subgoal1)
        let buf = []
        for (var i = 1; i < arg.goal.length; i++){
          var subgoal = arg.goal[i]
          buf.push(`subgoal ${ i + 1 } (ID ${ subgoal.string[0] }) is:`)
          buf.push(` ${ subgoal.string[1] }`)
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
    }

    if (arg.type == 'message') {
      outputChannel.appendLine(arg.message)
    }
  }, displayErrors)
}

let next = (editor, line) => {
  let cmd = editor.document.lineAt(line).text
  
  let handler = (arg) => {
    state[line] = arg.stateId
    let newPosition = new vscode.Position(line + 1, 0)
    successHandler(arg, editor, newPosition)
  }

  new Promise((resolve, reject) => {
    model.add(cmd).subscribe(handler, displayErrors)
    resolve()
  }).then(function () {
  }).catch(function () {
  })
}

let prev = (editor, line) => {
  let stateId = state[line - 1]

  let handler = (arg) => {
    delete state[line - 1]
    let newPosition = new vscode.Position(line - 1, 0)
    successHandler(arg, editor, newPosition) 
  }

  if (stateId) {
    new Promise((resolve, reject) => {
      model.editAt(stateId).subscribe(handler, displayErrors)
      resolve()
    }).then(function () {
    }).catch(function () {
    })
  }
}

let toCursor = (editor, line) => {
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
  prev,
  toCursor,
  destroy
}
