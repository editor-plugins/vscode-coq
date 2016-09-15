let CoqModel = require('./model')
let vscode   = require('vscode')

let model = null
let goalsChannel = vscode.window.createOutputChannel('Coq goals')
let messageChannel = vscode.window.createOutputChannel('Coq message')
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
      goalsChannel.appendLine(buf.join('\n'))
    } else {
      goalsChannel.appendLine(hypos.string)
    }
  }
  goalsChannel.appendLine('-'.repeat(100))
  goalsChannel.appendLine(subgoal[1])
}

let successHandler = (arg, editor, newPosition) => {
  let newSelection = new vscode.Selection(newPosition, newPosition)
  editor.selection = newSelection

  goalsChannel.clear()
  goalsChannel.show()

  let lines = Object.keys(state)

  console.log("state => " + JSON.stringify(state))
  console.log(state[244])
  console.log("lines => " + lines)
  console.log("state => " + JSON.stringify(state))  

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
    goalsChannel.clear()
    goalsChannel.show()
    if (!arg.message) {
      if (arg.goal instanceof Array) {
        let subgoal1 = arg.goal[0]
        goalsChannel.appendLine(`${ arg.goal.length } subgoals, subgoal 1 (ID ${ subgoal1.string[0] })\n`)
        displaySingleGoal(subgoal1)
        let buf = []
        for (var i = 1; i < arg.goal.length; i++){
          var subgoal = arg.goal[i]
          buf.push(`subgoal ${ i + 1 } (ID ${ subgoal.string[0] }) is:`)
          buf.push(` ${ subgoal.string[1] }`)
        }
        goalsChannel.appendLine('')
        goalsChannel.appendLine(buf.join('\n'))
      } else {
        if (arg.goal) {
          goalsChannel.appendLine(`1 subgoals, subgoal 1 (ID ${ arg.goal.string[0] })\n`)    
          displaySingleGoal(arg.goal)
        } else {
          goalsChannel.appendLine('No more subgoals.')
        }
      }
    } else {
      goalsChannel.appendLine(arg.message)
    }
  }, displayErrors)
}

let next = (editor, line) => {
  let newPosition = new vscode.Position(line + 1, 0)

  if (editor.document.lineAt(line).isEmptyOrWhitespace) {
    let newSelection = new vscode.Selection(newPosition, newPosition)
    editor.selection = newSelection
    return
  }
  let cmd = editor.document.lineAt(line).text
  
  let handler = (arg) => {
    if (arg.stateId) {
      state[line] = arg.stateId
      successHandler(arg, editor, newPosition)    
    }
  }

  new Promise((resolve, reject) => {
    model.add(cmd).subscribe(handler, displayErrors)
    resolve()
  }).then(function () {
  }).catch(function () {
  })
}

let prev = (editor, line) => {
  let newPosition = new vscode.Position(line - 1, 0)
  let stateId = state[line - 1]

  console.log("state => " + JSON.stringify(state))
  console.log("stateId => " + stateId)

  if (editor.document.lineAt(line - 1).isEmptyOrWhitespace || !stateId) {
    let newSelection = new vscode.Selection(newPosition, newPosition)
    editor.selection = newSelection
    return
  }
  
  let handler = (arg) => {
    delete state[line - 1]
    let newPosition = new vscode.Position(line - 1, 0)
    successHandler(arg, editor, newPosition) 
  }

  new Promise((resolve, reject) => {
    model.editAt(stateId).subscribe(handler, displayErrors)
    resolve()
  }).then(function () {
  }).catch(function () {
  })
}

let toCursor = (editor, line) => {
}

let displayErrors = (err) => {
  goalsChannel.clear()
  goalsChannel.show()
  goalsChannel.appendLine(err.message)
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
