const EntryTypes = Object.freeze({
  RAW: 0,
  CONSTRUCTED: 1,
});


class BibTeXEntry {
  constructor(entryType) {
    this.entryType = entryType;
  }
  
  getBibTex(){
    return null;
  }

  getEditPage(index){
    return null;
  }
}
class RawBibTeXEntry extends BibTeXEntry {
  constructor(bibTex) {
    super(EntryTypes.RAW)

    this.bibTeX = bibTex;
  }

  getBibTex(){
    return this.bibTeX;
  }

  getEditPage(index){
    let template = HtmlService.createTemplateFromFile('RawBibTeXEntry');
    template.bibTeXEntryIndex = index;
    template.bibTeXCode = this.bibTeX;

    return template.evaluate().setTitle('BibTeX For Docs - Edit Raw Entry');
  }

}

class ConstructedBibTexEntry extends BibTeXEntry {
  constructor(id, entry) {
    super(EntryTypes.CONSTRUCTED)
    this.entry = entry;
    this.id = id;

    this.fields = {};
  }

  setField(field, value){
    this.fields[field] = value;
  }

  fieldsAsString() {
    let fieldsString = "";
    for(let key in this.fields){
      fieldsString+=`    ${key}= {${this.fields[key]}},\n`
    }
    if(fieldsString.length>0){
      fieldsString = fieldsString.slice(0,-2) + '\n';
    }

    return fieldsString;
  }

  checkValid(){
    const requiredFields = {
      article: ["author", "title", "journal", "year"],
      book: ["author", "title", "publisher", "year"],
      booklet: ["title"],
      inbook: ["author", "title", "publisher", "year"],
      incollection: ["author", "title", "booktitle", "year"],
      inproceedings: ["author", "title", "booktitle", "year"],
      manual: ["title"],
      mastersthesis: ["author", "title", "school", "year"],
      misc: [],
      phdthesis: ["author", "title", "school", "year"],
      proceedings: ["title", "year"],
      techreport: ["author", "title", "institution", "year"],
      unpublished: ["author", "title", "note"]
    }

    if(requiredFields[this.entry]== undefined){
      return false;
    }
    const hasField = (field) => !!this.fields[field];
    return requiredFields[this.entry].every(hasField);
  }

  getBibTex(){
    if (this.checkValid()){
      return `@${this.entry}{${this.id},\n${this.fieldsAsString()}}`
    } else {
      return `@article{${this.id},\n title={Not All Required Fields Filled}\n}`
    }
    
  }

  getEditPage(index){
    let template = HtmlService.createTemplateFromFile('ConstructedBibTeXEntry');
    template.bibTeXEntryIndex = index;
    template.bibTeXEntryFields = JSON.stringify(this.fields);
    template.bibTeXEntryType = this.entry;

    return template.evaluate().setTitle('BibTeX For Docs - Edit Constructed Entry');
  }
}

function getDocumentCitations(){
  let documentProperties = PropertiesService.getDocumentProperties();

  let storedCitations = JSON.parse(documentProperties.getProperty("CITATIONS"));

  if(!storedCitations){
    return [];
  }
  let storedCitationsObjectList = []
  for(var i = 0; i<storedCitations.length; i++){
    let newObject = null;
    if(storedCitations[i].entryType==EntryTypes.RAW){
      storedCitationsObjectList[i] = new RawBibTeXEntry(storedCitations[i].bibTeX);
    } else if(storedCitations[i].entryType==EntryTypes.CONSTRUCTED){
      storedCitationsObjectList[i] = Object.assign(new ConstructedBibTexEntry(""), storedCitations[i]);
    }
  }
  return storedCitationsObjectList;
}
function setDocumentCitations(citations){
  let documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.setProperty("CITATIONS",JSON.stringify(citations))
}

function goToEntry(entryIndex){
  entryIndex = parseInt(entryIndex);

  DocumentApp.getUi().showSidebar(
    getDocumentCitations()[entryIndex].getEditPage(entryIndex)
  );

}

function removeEntry(index){
  index = parseInt(index);

  let entrys = getDocumentCitations();
  entrys.splice(index,1)
  setDocumentCitations(entrys);
}

function createRawEntry(){
  let entrys = getDocumentCitations();
  let newEntryIndex = entrys.push(
    new RawBibTeXEntry("")
  ) - 1;
  setDocumentCitations(entrys);
  goToEntry(newEntryIndex);
}
function modifyRawEntry(index, bibTex){
  let entrys = getDocumentCitations();
  entrys[index] = new RawBibTeXEntry(bibTex);
  setDocumentCitations(entrys);
}

function createConstructedEntry(){
  let entrys = getDocumentCitations();
  let newEntryIndex = entrys.push(
    new ConstructedBibTexEntry(null, "")
  ) - 1;
  setDocumentCitations(entrys);
  goToEntry(newEntryIndex);
}
function modifyConstructedEntry(index, entryType, fields){
  let entrys = getDocumentCitations();
  entrys[index] = new ConstructedBibTexEntry(index, entryType);
  entrys[index].fields = fields;
  setDocumentCitations(entrys);
}

function getCitationsWithBibTex(){
  let citations = getDocumentCitations();
  for(const citation of citations){
    citation["computedBibTeX"] = citation.getBibTex();
  }
  return citations;
}
