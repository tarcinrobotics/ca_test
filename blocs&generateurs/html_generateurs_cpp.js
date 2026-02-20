// HTML block generators (unchanged from original)
Blockly.Arduino['html_wrapper'] = function (block) {
  const inner = Blockly.Arduino.statementToCode(block, 'HTML_BODY');
  return inner; // this will be inserted into the server handler
};


Blockly.Arduino['html_heading'] = function (block) {
  const level = block.getFieldValue('level');
  const text = block.getFieldValue('text').replace(/"/g, '\\"');
  return `  ptr += "<h${level}>${text}</h${level}>";\n`;
};


Blockly.Arduino['html_paragraph'] = function (block) {
  const text = block.getFieldValue('text').replace(/"/g, '\\"');
  return `  ptr += "<p>${text}</p>";\n`;
};


Blockly.Arduino['html_line_break'] = function () {
  return '  ptr += "<br>";\n';
};
Blockly.Arduino['html_horizontal_rule'] = function () {
  return '  ptr += "<hr>";\n';
};

Blockly.Arduino['html_link'] = function (block) {
  const text = block.getFieldValue('text').replace(/"/g, '\\"');
  const url  = block.getFieldValue('url').replace(/"/g, '\\"');
  return `  ptr += "<a href=\\"${url}\\">${text}</a>";\n`;
};
Blockly.Arduino['html_button'] = function (block) {
  const id    = block.getFieldValue('id');
  const label = block.getFieldValue('label').replace(/"/g, '\\"');
  return `  ptr += "<a class=\\"button\\" href=\\"/${id}\\">${label}</a>";\n`;
};