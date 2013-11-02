// global varibles
var db       = ScriptDb.getMyDb();
var SUCCESS  = JSON.stringify({stat: 'success'});
var FAIL     = JSON.stringify({stat: 'fail'});
var FAIL_DUPLICATE= JSON.stringify({stat: 'duplicate'});
var FAIL_NOENOUGH = JSON.stringify({stat: 'no enough'});
var FAIL_UNKNOWN  = JSON.stringify({stat: 'unknown method'});


// return JSONP.
function doGet(e) {
  Logger.log(e);
  var returnStr = parseRequest(e);
  return ContentService.createTextOutput(returnStr)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  Logger.log(e);
  var returnStr = parseRequest(e);
  return ContentService.createTextOutput(returnStr)
    .setMimeType(ContentService.MimeType.JSON);
}



function parseRequest(e) {
  
  // Returning this string
  var returnStr = SUCCESS;
  
  // Get method key
  var param = e.parameter;
  var method = param.method;
  
  Logger.log('[parseRequest]method=' + method);
  
  // GET method=debug
  // print everything in db
  if (method == 'debug') {
    returnStr = debug();
  }
  // GET method=pull1
  // return 3 words, from 1-word db
  else if (method == 'pull1') {
    returnStr = pull1();
  }
  // GET method=pull3
  // return 3 words, from 3-word db
  else if (method == 'pull3') {
    returnStr = pull3();
  }
  // GET method=pullArticle&aid=***
  // return article with aid(if aid=null then random aid)
  else if (method == 'pullArticle') {
    returnStr = pullArticle(param.aid);
  }
  // POST method=push1&word=***
  // add 1 word to db
  else if (method == 'push1') {
    returnStr = push1(param.word);
  }
  // POST method=push3&words=***
  // add 3 words to db
  else if (method == 'push3') {
    returnStr = push3(param.words);
  }
  // POST method=pushArticle&words=***&content=***&author=***
  // add an article to db
  else if (method == 'pushArticle') {
    returnStr = pushArticle(param.words, param.content, param.author);
  }
  // else failed
  else {
    returnStr = FAIL_UNKNOWN;
  }
  
  return returnStr;
}



/* debug */
function debug() {
  var results = db.query({});
  var returnStr = '';

  while (results.hasNext()) {
    var result = results.next();
    returnStr += JSON.stringify(result) + '\n';
  }
  
  Logger.log(returnStr);
  
  returnStr = {
    data: returnStr
  };
  
  return JSON.stringify(returnStr);
}



/* push1, pull1 */

/**
 * push1
 * @brief  store 1 word to db
 * @param  word
 * @return string as status
 */
function push1(word) {
  // if the word is existed, return instantly
  var result = db.query({ type: '1word', word: word });
  if (result.getSize() != 0) {
    Logger.log('[push1]'+word+' is existed.');
    return FAIL_DUPLICATE;
  }
  
  // add the word to db
  var item = db.save({ type: '1word', word: word });
  Logger.log('[push1]'+word+' saved to db.');
  Logger.log('[push1]'+item);
  
  return SUCCESS;
}

/**
 * pull1
 * @brief  return THREE random word from db
 * @return string
 */
function pull1() {
  // query all 1word form db
  var results = db.query({ type: '1word' });
  if (results.getSize() < 3) {
    Logger.log('[pull1]no enough word');
    return FAIL_NOENOUGH;
  }
  
  // list of id for query. don't look at this
  var idList = new Array(3);
  var idRange = results.getSize();
  idList[0] = Math.floor(Math.random() * idRange);
  idList[1] = Math.floor(Math.random() * idRange);
  while (idList[0] == idList[1]) { idList[1] = (idList[1]+1) % idRange; }
  idList[2] = Math.floor(Math.random() * idRange);
  while (idList[0] == idList[2] || idList[1] == idList[2]) { idList[2] = (idList[2]+1) % idRange; }
  Logger.log('[pull1]idList: ' + idList);
  
  // get all words into a array
  var words = new Array();
  for (var i=0; results.hasNext(); i ++) {
    words[i] = results.next().word;
  }
  
  // returning string
  var returnStr = words[idList[0]] + ' ' + words[idList[1]] + ' ' + words[idList[2]];
  
  var result = {
    words: returnStr,
    type: '3words'
  }
    
  return JSON.stringify(result);
}




/* push3, pull3 */

/**
 * push3
 * @brief  store 3-words string to db
 * @param  words
 * @return string as status
 */
function push3(words) {
  // if the words is existed, return instantly
  var result = db.query({ type: '3words', words: words });
  if (result.getSize() != 0) {
    Logger.log('[push3]'+words+' is existed.');
    return FAIL_DUPLICATE;
  }
  
  // add the words to db
  var item = db.save({ type: '3words', words: words });
  Logger.log('[push3]'+words+' saved to db.');
  Logger.log('[push3]'+item);
  
  // then push each word to db
  var wordArr = new Array(3);
  wordArr = words.split(' ');
  for(var i in wordArr) {
    push1(wordArr[i]);
  }
  
  return SUCCESS;
}

/**
 * pull3
 * @brief  return a string, 3 words from db
 * @return string
 */
function pull3() {
  // query all 3words form db
  var results = db.query({ type: '3words' });
  if (results.getSize() < 1) {
    Logger.log('[pull3]no enough word');
    return FAIL_NOENOUGH;
  }
  
  // getSize is return REMAINING size after hasNext() and next(), so must be called before them
  var no = Math.floor(Math.random() * results.getSize());
  Logger.log('[pull3]id: '+no);

  // result
  var result = db.query({ type: '3words' });
  for(var i = 0; i < no; i ++) {
    results.next();
  }
  var result = results.next();
  Logger.log('pull3]'+JSON.stringify(result));
 
  return JSON.stringify(result);
}


/* pushArticle, pullArticle */
function pushArticle(words, content, author) {
  // get last aid
  var aid = parseInt(ScriptProperties.getProperty('lastAid'));
  Logger.log('[pushArticle] lastAid='+aid);
  
  // get current content's hashcode
  var hashCode = content.hashCode();
  
  // find if duplicated content exists
  var result = db.query({ type: 'article', hashCode: hashCode });
    if (result.getSize() != 0) {
    Logger.log('[pushArticle]'+hashCode+'(hash) is existed.');
    return FAIL_DUPLICATE;
  }
  
  // set new article ID
  aid ++;
  ScriptProperties.setProperty('lastAid', aid);
  
  // add the article to db
  var timeStamp = (new Date()).valueOf();
  var item = db.save({
    type     : 'article',
    words    : words,
    content  : content,
    author   : author,
    aid      : String(aid),
    hashCode : hashCode,
    timeStamp: timeStamp
  });
  Logger.log('[pushArticle]'+hashCode+'(hash) saved to db.');
  Logger.log('[pushArticle]'+item);
  
  return SUCCESS; 
}

function pullArticle(aid) {
  
  // query all articles
  if (!aid || aid=='') {
    var results = db.query({ type: 'article' }).sortBy('aid');
    var resultSize = results.getSize();
    var no = Math.floor(Math.random() * resultSize);
    Logger.log('[pullArticle]random no: '+no);
    
    for(var i = 0; i < no; i ++) {
      results.next();
    }
    var result = results.next();
  }
  else {
    var results = db.query({ type: 'article', aid: aid });
    if (results.getSize() < 1) {
      Logger.log('[pullArticle]no article aid='+aid);
      return FAIL_NOENOUGH;
    }
    var result = results.next();
  }
  Logger.log(result);
  return JSON.stringify(result);
}



/* hash */

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}


function test() {
  debug();
}