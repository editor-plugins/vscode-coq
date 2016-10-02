let ET = require('elementtree')
let _  = require('lodash')

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

let parse_response = (xml) => {
  if (xml.tag == 'value') {
    if (xml.get('val') = 'good') {
      return Ok(parse_value(xml._children[0]), null)
    } else if (xml.get('val') == 'fail') {
      console.log('err: ' + ET.tostring(xml))
      return Err(parse_error(xml))
    } else {
      console.log('expected "good" or "fail" in <value>')
    }
  }else {
    console.log('value tag missing')
  }
}

let itertext = (xml) => {
  let text = xml.text
  let tail = xml.tail
  _.concat(_.filter([text, tail], (e) => { return e != null }), _.flatMap(xml._children, itertext))
}

let parse_value = (xml) => {
  if (xml.tag == 'unit') {
    return []
  } else if (xml.tag == 'bool') {
    if (xml.get('val') == 'true') {
      return true
    } else if (xml.get('val') == 'false') {
      return false
    } else{
      console.log('expected "true" or "false" in <bool>')
    }
  } else if (xml.tag == 'string') {
    return xml.text
  } else if (xml.tag == 'int') {
    return parseInt(xml.text)
  } else if (xml.tag == 'state_id') {
    return StateId(parseInt(xml.get('val')))
  } else if (xml.tag == 'list') {
    return _.map(xml._children, parse_value)
  } else if (xml.tag == 'option') {
    if (xml.get('val') == 'none') {
      return Option(null)
    } else if (xml.get('val') == 'some') {
      return Option(parse_value(xml._children[0]))
    } else {
      console.log('expected "none" or "some" in <option>')
    }
  } else if (xml.tag == 'pair') {
      return _.map(xml._children, parse_value)
  } else if (xml.tag == 'union') {
    if (xml.get('val') == 'in_l') {
      return Inl(parse_value(xml._children[0]))
    } else if (xml.get('val') == 'in_r') {
      return Inr(parse_value(xml._children[0]))
    } else {
      console.log('expected "in_l" or "in_r" in <union>')
    }
  } else if (xml.tag == 'option_state') {
    let [sync, depr, name, value] = _.map(xml._children, parse_value)
    return OptionState(sync, depr, name, value)
  } else if (xml.tag == 'option_value') {
    return OptionValue(parse_value(xml._children[0]))
  } else if (xml.tag == 'status') {
    let [path, proofname, allproofs, proofnum] = _.map(xml._children, parse_value) 
    return Status(path, proofname, allproofs, proofnum)
  } else if (xml.tag == 'goals') {
    let [fg, bg, shelved, given_up] = _.map(xml._children, parse_value)
    return Goals(fg, bg, shelved, given_up)
  } else if (xml.tag == 'goal') {
    let [id, hyp, ccl] = _.map(xml._children, parse_value) 
    return Goal(id, hyp, ccl)
  } else if (xml.tag == 'evar') {
    let info = _.map(xml._children, parse_value)[0]
    return Evar(info)
  } else if *xml.tag == 'xml' or xml.tag == 'richpp') {
    return ''.join(itertext(xml))
  }
}

let parse_error = (xml) => {
  return ET.parse(ET.tostring(xml).replace(/<state_id val=\"\d+\" \/>/g, ''))
}
