let cp = require('child_process')
let pc = require('pycollections')

let Ok = pc.NamedTuple('Ok', ['val', 'msg'])
let Err = pc.NamedTuple('Err', ['err'])

let Inl = pc.NamedTuple('Inl', ['val'])
let Inr = pc.NamedTuple('Inr', ['val'])

let StateId = pc.NamedTuple('StateId', ['id'])
let Option = pc.NamedTuple('Option', ['val'])

let OptionState = pc.NamedTuple('OptionState', ['sync', 'depr', 'name', 'value'])
let OptionValue = pc.NamedTuple('OptionValue', ['val'])

let Status = pc.NamedTuple('Status', ['path', 'proofname', 'allproofs', 'proofnum'])

let Goals = pc.NamedTuple('Goals', ['fg', 'bg', 'shelved', 'given_up'])
let Goal = pc.NamedTuple('Goal', ['id', 'hyp', 'ccl'])
let Evar = pc.NamedTuple('Evar', ['info'])

