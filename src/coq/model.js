let Coqtop = require('./coqtop')
let xml    = require('../xml')
let Rx     = require('rx-lite')

class CoqModel {
  constructor() {
    this.stateId = 1
    this.uniqueId = 0
    this.coqtopRef = null
    this.subjects = {}
  }

  coqtop() {
    if (!this.coqtopRef) {
      this.coqtopRef = new Coqtop()
      this.coqtopRef.on('message', (obj) => { this.handleCommand(obj) })
      this.coqtopRef.start()
    }
    return this.coqtopRef
  }

  stop() {
    this.coqtopRef.stop()
  }

  prepareCommand(cmd) {
    let subject = new Rx.Subject
    this.uniqueId++
    this.subjects[this.uniqueId] = subject
    this.coqtop().send(cmd)
    return subject
  }

  handleCommand(cmd) {
    console.log("cmd => " + JSON.stringify(cmd))
    if (this.subjects[this.uniqueId] == null) return
    let subject = this.subjects[this.uniqueId]

    if (cmd.coqtoproot.value) {
      if (cmd.coqtoproot.value.val == 'good') {
        if (cmd.coqtoproot.value.pair && cmd.coqtoproot.value.pair.state_id.val) {
          let newStateId = cmd.coqtoproot.value.pair.state_id.val
          let oldStateId = this.stateId
          this.stateId = newStateId
          subject.onNext({
            stateId: oldStateId
          })
        } else if (cmd.coqtoproot.value.option && cmd.coqtoproot.value.option.goals) {
          subject.onNext({
            goal: cmd.coqtoproot.value.option.goals.list[0].goal
          })
        } else if (cmd.coqtoproot.value.option && cmd.coqtoproot.value.option.val == 'none') {
          // Qed. => no more goals
        } else {
          subject.onNext()
        }
      } else {
        let msg = cmd.coqtoproot.feedback ?
          cmd.coqtoproot.feedback.feedback_content.string :
          "error"
        subject.onError({
          message: msg  
        })
      }
    }
  }

  init() {
    return this.prepareCommand('<call val="Init"><option val="none"/></call>')
  }

  add(cmd) {
    return this.prepareCommand(`<call val="Add"><pair><pair><string>${xml.escapeXml(cmd.trim())}</string><int>-1</int></pair><pair><state_id val="${this.stateId}"/><bool val="false"/></pair></pair></call>`)
  }

  editAt(stateId) {
    this.stateId = stateId
    return this.prepareCommand(`<call val="Edit_at"><state_id val="${stateId}"/></call>`)
  }

  goals() {
    return this.prepareCommand('<call val="Goal"><unit/></call>')
  }
}

module.exports = CoqModel
