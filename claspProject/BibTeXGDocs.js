/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createTemplateFromFile('sidebar')
    .evaluate().setTitle('BibTeX Gdocs - Citation List');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Includes one HTML file in another
 * @param {*} filename 
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function insertCitation(citationHTML, citationText){

  let body = DocumentApp.getActiveDocument().getBody()
  let citationParagraph = body.appendParagraph(citationText);
  let citationParagraphText = citationParagraph.editAsText();

  let parser = XmlService.parse(citationHTML);
  let root = parser.getRootElement();
  for(const citation of root.getChildren()){
    for(const formattingElement of citation.getChildren()){
      let textToFromat = formattingElement.getValue();
      let startIndex = citationText.indexOf(textToFromat);
      let formattingFn = null;
      if(formattingElement.getName()=="i"){
        formattingFn = citationParagraphText.setItalic;
      } else if(formattingElement.getName()=="b") {
        formattingFn = citationParagraphText.setBold;
      }
      formattingFn(startIndex,startIndex+textToFromat.length, true);
    }
  }
}

function setStyle(styleData){
  let documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.setProperty("CITATIONSTYLE",styleData);
}

function getStyleData(){
  let documentProperties = PropertiesService.getDocumentProperties();
  return JSON.parse(documentProperties.getProperty("CITATIONSTYLE"));
}