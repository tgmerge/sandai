var url = "https://script.google.com/macros/s/AKfycbxz4jcyKdpZB57LEJ8eYULILpesuqZOGds5jNuZcdkLJDiOZfJt/exec";

function animateChange(jQobj, text) {
  jQobj.fadeTo("fast", 0.1, function(){jQobj.text(text)});
  jQobj.fadeTo("fast", 1);
}

/* --- switch --- */

function switchTo(targetId) {
  var parts = new Array($('div#editor'), $('div#reader'), $('div#poster'));
  var tags = new Array($('a#switch-editor'), $('a#switch-reader'), $('a#switch-poster'));
  var target = $('div#'+targetId);
  var tag = $('a#switch-'+targetId);
  for(var i in parts) {
    parts[i].hide();
    tags[i].fadeTo(10, 0.5);
  }
  target.fadeIn("fast");
  tag.fadeTo(10, 1);
}

/* --- pull --- */

function pull1() {
  var articleTextarea = $('div#editor textarea#article');
  var topicDiv = $('div#editor div#topic-words');
  var statDiv = $('div#editor span#status');
  if (articleTextarea.val()) {
    animateChange(statDiv, '>>安全起见, 请先清空现有文本内容。');
    return;
  }
  animateChange(topicDiv, '主题词 正在 读取中');
  $.get(
    url, {
      method: "pull1"
    },
    function(data) {
      animateChange(topicDiv, data.words);
    }
  );
}

function pull3() {
  var articleTextarea = $('div#editor textarea#article');
  var topicDiv = $('div#editor div#topic-words');
  var statDiv = $('div#editor span#status');
  if (articleTextarea.val()) {
    animateChange(statDiv, '>>安全起见, 请先清空现有文本内容。');
    return;
  }
  animateChange(topicDiv, '主题词 正在 读取中');
  $.get(
    url, {
      method: "pull3"
    },
    function(data) {
      animateChange(topicDiv, data.words);
    }
  );
}

function pullArticle() {
  var articleTextarea = $('div#reader textarea#article');
  var authorInput = $('div#reader input#author')
  var topicDiv = $('div#reader div#topic-words');
  var statDiv = $('div#reader span#status');
  animateChange(topicDiv, '文章 正在 读取中');
  $.get(
    url, {
      method: "pullArticle"
    },
    function(data) {
      if(data.stat) {
        animateChange(statDiv, data.stat);
      }
      else {
        animateChange(topicDiv, data.words);
        articleTextarea.val(data.content);
        authorInput.val(data.author);
      }
    }
  );
}

/* --- push --- */

function push1() {
  var statDiv = $('div#poster span#status');
  var words = new Array();
  words = $('div#poster input#topic-words').val().split(/[ 　,，、]+/);
  if (words[0] == '' || words.length != 1) {
    animateChange(statDiv, '>>请输入一个词语。');
    return;
  }
  animateChange(statDiv, '>>发送中');
  $.post(
    url, {
      method: "push1",
      word: words[0]
    },
    function(data) {
      animateChange(statDiv, data.stat);
    });
}

function push3() {
  var statDiv = $('div#poster span#status');
  var words = new Array();
  words = $('div#poster input#topic-words').val().split(/[ 　,，、]+/);
  if(words.length != 3) {
    animateChange(statDiv, '>>请输入三个用空格、逗号或顿号分隔的词语。');
    return;
  }
  animateChange(statDiv, '>>发送中');
  $.post(
    url, {
      method: "push3",
      words: words.join(' ')
    },
    function(data) {
      animateChange(statDiv, data.stat);
    });
}

function pushArticle() {
  var statDiv = $('div#editor span#status');
  var content = $.trim($('div#editor textarea#article').val());
  var words = $('div#editor div#topic-words').text();
  var author = $.trim($('div#editor input#author').val());
  if (content == '') {
    animateChange(statDiv, '>> 请输入文章。');
    return;
  }
  if (content.length > 1500) {
    animateChange(statDiv, '>> 请限制长度为1500字以内。现在的长度是'+content.length+'。');
    return;
  }
  animateChange(statDiv, '>> 发送中');
  $.post(
    url, {
      method: "pushArticle",
      content: content,
      words: words,
      author: author
    },
    function(data) {
      animateChange(statDiv, data.stat);
    });
}

function testdebug() {
  $('p#debug').text('loading...');
  $.get(
    url, {
      method: "debug"
    },
    function(data) {
      ret = data;
      $('p#debug').text(data.data);
    }
  );
}


/** 事件 **/