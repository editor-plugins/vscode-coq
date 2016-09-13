let parser = require('xml2json')

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt'
      case '>': return '&gt'
      case '&': return '&amp'
      case '\'': return '&apos'
      case '"': return '&quot'
    }
  })
}

let trans = (s) => {
  return ('<coqtoproot>' + s + '</coqtoproot>').replace(/&nbsp/g, ' ')
}

let parse = (s) => {
  return JSON.parse(parser.toJson(trans(s)))
}

module.exports = {
  parse,
  escapeXml
}
