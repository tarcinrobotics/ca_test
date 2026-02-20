// ================================
// ✅ FIXED: HTML BLOCK DEFINITIONS (html_blocs.js)
// ================================

Blockly.Blocks['html_wrapper'] = {
  init: function () {
    this.appendDummyInput().appendField("HTML Content Wrapper");
    this.appendStatementInput("HTML_BODY").setCheck("html_element");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(195);
    this.setTooltip("Wrap multiple HTML blocks to send to Web Server");
  }
};

Blockly.Blocks['html_heading'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Heading")
      .appendField(new Blockly.FieldDropdown([
        ["h1", "1"], ["h2", "2"], ["h3", "3"],
        ["h4", "4"], ["h5", "5"], ["h6", "6"]
      ]), "level")
      .appendField(new Blockly.FieldTextInput("Title"), "text");
    this.setPreviousStatement(true, "html_element");
    this.setNextStatement(true, "html_element");
    this.setColour(210);
    this.setTooltip("Adds a heading tag (h1-h6)");
  }
};

Blockly.Blocks['html_paragraph'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Paragraph")
      .appendField(new Blockly.FieldTextInput("Your text here..."), "text");
    this.setPreviousStatement(true, "html_element");
    this.setNextStatement(true, "html_element");
    this.setColour(210);
    this.setTooltip("Adds a paragraph block");
  }
};

Blockly.Blocks['html_line_break'] = {
  init: function () {
    this.appendDummyInput().appendField("Line Break <br>");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Adds a line break");
  }
};

Blockly.Blocks['html_horizontal_rule'] = {
  init: function () {
    this.appendDummyInput().appendField("Horizontal Rule <hr>");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Adds a horizontal line");
  }
};

Blockly.Blocks['html_link'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Link")
      .appendField(new Blockly.FieldTextInput("Click Here"), "text")
      .appendField("URL")
      .appendField(new Blockly.FieldTextInput("/#"), "url");
    this.setPreviousStatement(true, "html_element");
    this.setNextStatement(true, "html_element");
    this.setColour(210);
    this.setTooltip("Creates a clickable link");
  }
};


Blockly.Blocks['html_button'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Button")
      .appendField("ID")
      .appendField(new Blockly.FieldTextInput("1"), "id")
      .appendField("Label")
      .appendField(new Blockly.FieldTextInput("Toggle LED"), "label");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Creates a button with ID to trigger action");
  }
};