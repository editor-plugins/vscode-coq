let CoqModel = require('./model')
let vscode   = require('vscode')
let _        = require('underscore')

function countWhile(obj, iterator, context) {
  if (obj == null) return undefined
  var count = 0
  _.every(obj, function(value, index, list) {
    return iterator.call(context, value, index, list) && (++count)
  })
  return count
}

_.mixin({
  takeWhile: function(obj, iterator, context) {
    if (obj == null) return []
    return _.take(obj, countWhile(obj, iterator, context))
  },

  dropWhile: function(obj, iterator, context) {
    if (obj == null) return []
    return _.drop(obj, obj.length - countWhile(obj, iterator, context) + 1)
  }
})

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

let addProofDecoration = (editor, lines) => {
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
}

let successHandler = (arg, editor, newPosition) => {
  let newSelection = new vscode.Selection(newPosition, newPosition)
  editor.selection = newSelection

  outputChannel.clear()
  outputChannel.show()

  let lines = Object.keys(state)
  addProofDecoration(editor, lines)
  
  model.goals().subscribe((arg) => {
    outputChannel.clear()
    outputChannel.show()
    if (!arg.message) {
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
    } else {
      outputChannel.appendLine(arg.message)
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
  let lines = Object.keys(state)
  let min = lines.length != 0 ? Math.min.apply(null, lines) : 0
  let max = lines.length != 0 ? Math.max.apply(null, lines) : 0

  console.log("min => " + min)
  console.log("max => " + max)

  if (line <= min) {
    state = {}
    editor.setDecorations(proofDecorationType, [])
    destroy()
    model = null
  } else if (line > max) {
    var cmds = []
    for (var l = max; l < line; l++) {
      if (!editor.document.lineAt(l).isEmptyOrWhitespace) {
        cmds.push([l, editor.document.lineAt(l).text])
      }
    }
    console.log("cmds => " + cmds)

    let handler = (line, arg) => {
      if (arg.stateId) {
        state[line] = arg.stateId
        cmds = cmds.slice(1, cmds.length)
        if (cmds.length == 1) {
          next(editor, cmds[0][0])
        } else {
          sequence()
        }
      }
    }

    let sequence = () => {
      let pair = cmds[0]
      new Promise((resolve, reject) => {
        model.add(pair[1]).subscribe((arg) => { handler(pair[0], arg) }, displayErrors)
        resolve()
      }).then(function () {
      }).catch(function () {
      })
    }

    sequence()
  } else {
    let reserveLines = _.takeWhile(lines, (elem) => { return elem <= line })
    let editLine = Math.max.apply(null, reserveLines)
    let deleteLines = _.dropWhile(lines, (elem) => { return elem <= line })

    deleteLines.forEach((l) => {
      delete state[l]
    })

    let stateId = state[editLine]
    delete state[editLine]

    let handler = (arg) => {
      let newPosition = new vscode.Position(line, 0)
      successHandler(arg, editor, newPosition)
    }

    new Promise((resolve, reject) => {
      model.editAt(stateId).subscribe(handler, displayErrors)
      resolve()
    }).then(function () {
    }).catch(function () {
    })
  }
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
