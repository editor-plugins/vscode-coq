let Coqtop = require('./coqtop')
let Rx     = require('rx-lite')
let xml    = require('../xml')

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
    if (cmd.coqtoproot.value.pair.state_id.val) {
      let newStateId = cmd.coqtoproot.value.pair.state_id.val
      if (this.subjects[this.stateId] != null) {
        let subject = this.subjects[this.stateId]
        let oldStateId = this.stateId
        this.stateId = newStateId
        subject.onNext({
          stateId: oldStateId
        })
      }
    } else if (cmd.coqtoproot.value.option.goals) {
      if (this.subjects[this.stateId] != null) {
        let subject = this.subjects[this.stateId]
        subject.onNext({
          goal: cmd.coqtoproot.value.option.goals.list[0].goal
        })
      }
    }
  }

  init() {
    return this.prepareCommand('<call val="Init"><option val="none"/></call>')
  }

  add(cmd) {
    return this.prepareCommand(`<call val="Add"><pair><pair><string>${xml.escapeXml(cmd)}</string><int>-1</int></pair><pair><state_id val="${this.stateId}"/><bool val="true"/></pair></pair></call>`)
  }

  editAt(stateId) {
    return this.prepareCommand(`<call val="Edit_at"><state_id val="${stateId}"/></call>`)
  }

  goals() {
    return this.prepareCommand('<call val="Goal"><unit/></call>')
  }
}

module.exports = CoqModel
