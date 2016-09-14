let Coqtop = require('./coqtop')
let xml    = require('../xml')
let Rx     = require('rx-lite')

class CoqModel {
  constructor() {
    this.stateId = 1
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
    this.subjects[this.stateId] = subject
    this.coqtop().send(cmd)
    return subject
  }

  handleCommand(cmd) {
    console.log("cmd => " + JSON.stringify(cmd))
    if (cmd.coqtoproot.value) {
      if (cmd.coqtoproot.value.val == 'good') {
        if (cmd.coqtoproot.value.pair && cmd.coqtoproot.value.pair.state_id.val) {
          let newStateId = cmd.coqtoproot.value.pair.state_id.val
          if (this.subjects[this.stateId] != null) {
            let subject = this.subjects[this.stateId]
            let oldStateId = this.stateId
            this.stateId = newStateId
            subject.onNext({
              stateId: oldStateId
            })
          }
        } else if (cmd.coqtoproot.value.option && cmd.coqtoproot.value.option.goals) {
          if (this.subjects[this.stateId] != null) {
            let subject = this.subjects[this.stateId]
            subject.onNext({
              goal: cmd.coqtoproot.value.option.goals.list[0].goal
            })
          }
        }
      } else {
        if (this.subjects[this.stateId] != null) {
          let subject = this.subjects[this.stateId]
          subject.onError({
            message: cmd.coqtoproot.feedback.feedback_content.string 
          })
        }
      }
    }
  }

  init() {
    return this.prepareCommand('<call val="Init"><option val="none"/></call>')
  }

  add(cmd) {
    console.log(`send command => <call val="Add"><pair><pair><string>${xml.escapeXml(cmd.trim())}</string><int>-1</int></pair><pair><state_id val="${this.stateId}"/><bool val="false"/></pair></pair></call>`)
    return this.prepareCommand(`<call val="Add"><pair><pair><string>${xml.escapeXml(cmd.trim())}</string><int>-1</int></pair><pair><state_id val="${this.stateId}"/><bool val="false"/></pair></pair></call>`)
  }

  editAt(stateId) {
    return this.prepareCommand(`<call val="Edit_at"><state_id val="${stateId}"/></call>`)
  }

  goals() {
    console.log("send goal command")
    return this.prepareCommand('<call val="Goal"><unit/></call>')
  }
}

module.exports = CoqModel
