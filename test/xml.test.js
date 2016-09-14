let assert = require("assert")
let xml    = require('../src/xml')

let xml1 = '<feedback object="state" route="0"><state_id val="11"/><feedback_content val="errormsg"><loc start="8" stop="16"/><string>Error:&nbsp;plus_0_r&nbsp;already&nbsp;exists.</string></feedback_content></feedback><value val="fail" loc_s="8" loc_e="16"><state_id val="10"/>Error:&nbsp;plus_0_r&nbsp;already&nbsp;exists.</value>'
let json1 = 
{ coqtoproot: {
  feedback: {
    object: 'state',
    route: '0',
    state_id: { val: '11' },
    feedback_content: {
      val: 'errormsg',
      loc: { start: '8', stop: '16' },
      string: 'Error: plus_0_r already exists.' }
  },
  value: {
    val: 'fail',
    loc_s: '8',
    loc_e: '16',
    state_id: { val: '10' }
  }
}}
let xml2 = '<feedback object="state" route="0"><state_id val="2"/><feedback_content val="processingin"><string>master</string></feedback_content></feedback><feedback object="state" route="0"><state_id val="1"/><feedback_content val="processed"/></feedback><feedback object="state" route="0"><state_id val="2"/><feedback_content val="processed"/></feedback><value val="good"><option val="some"><goals><list><goal><string>2</string><list/><string>forall&nbsp;n&nbsp;:&nbsp;nat,&nbsp;n&nbsp;+&nbsp;0&nbsp;=&nbsp;n</string></goal></list><list/><list/><list/></goals></option></value>'
let json2 =
{ coqtoproot: {
  feedback: [
    { object: 'state',
      route: '0',
      state_id: { val: '2' },
      feedback_content: { val: 'processingin', string: 'master' } },
    { object: 'state',
      route: '0',
      state_id: { val: '1' },
      feedback_content: { val: 'processed' } },
    { object: 'state',
      route: '0', 
      state_id: { val: '2' },
      feedback_content: { val: 'processed' } }
  ],
  value: {
    val: 'good',
    option: { val: 'some', goals: { list: [ { goal: { string: [ '2', 'forall n : nat, n + 0 = n' ], list: {} } }, {}, {}, {} ] } }
  }
}} 
let xml3 = '<feedback object="state" route="0"><state_id val="2"/><feedback_content val="processed"/></feedback><value val="good"><option val="some"><goals><list><goal><string>2</string><list/><string>forall&nbsp;n&nbsp;:&nbsp;nat,&nbsp;n&nbsp;+&nbsp;0&nbsp;=&nbsp;n</string></goal></list><list/><list/><list/></goals></option></value>'
let json3 = 
{ coqtoproot: { 
  feedback: {
    object: 'state',
    route: '0',
    state_id: { val: '2' },
    feedback_content: { val: 'processed' } },
  value: {
    val: 'good',
    option: { val: 'some', goals: { list: [ { goal: { string: [ '2', 'forall n : nat, n + 0 = n' ], list: {} } }, {}, {}, {} ] } }
  }
}}

let objectEqual = (a, b) => {
  return JSON.stringify(a) == JSON.stringify(b)
}

suite("parse xml", () => {
  test("parse coqtop result", () => {
    assert.equal(objectEqual(xml.parse(xml1), json1), true)
    assert.equal(objectEqual(xml.parse(xml2), json2), true)
    assert.equal(objectEqual(xml.parse(xml3), json3), true)
  })
})
