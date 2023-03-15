const properties = PropertiesService.getScriptProperties().getProperties();
const LINE_TOKEN = properties['LINE_TOKEN'];
const APIKEY = properties['APIKEY'];
const cache = CacheService.getDocumentCache();

// API 消費を抑えるため回答文字数を制限する。適宜好みに応じて調整。
const postscript = '(指示がない限りは20文字以内で回答してください。)';


function doPost(e) {
  try {
    return doPostProxy(e);
  } catch (err) {
    log(err.stack);
  }
}


function doPostProxy(e) {
  const event = JSON.parse(e.postData.contents).events[0];
  const replyToken = event.replyToken;
  const inputText = event.message.text;
  if (inputText == null) 
    return replyFromLinebot(replyToken, 'スタンプは利用できません。😱\nバージョン47の更新をお待ちください。\nバージョンは「/v」で確認できます。');
  
  if (inputText.length < 2) 
    return replyFromLinebot(replyToken, '入力文字数が少なすぎます。2文字以上で会話してください。😎');
  
  if (inputText[0] !== '→') {
    // 先頭に「→」がない投稿の場合は、前の会話内容を引き継がず新たな会話を開始する。
    initializeMessages();
  }
  // messages 配列にユーザーの入力を追加
  const messages = updateMessages('user', inputText + postscript);
  
  // ChatGPT API に最新の質問を含む会話の配列を渡して、応答を得る。
  const answer = getAnswer(messages);
  
  // messages 配列に ChatGPT API からの応答を追加。
  updateMessages('assistant', answer);
  
  return replyFromLinebot(replyToken, answer);
}


// ChatGPT API に最新の質問を含む会話の配列を渡して、最新の質問に対する応答を得る。
function getAnswer(messages){
  const openai_api_endpoint = 'https://api.openai.com/v1/chat/completions';
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + APIKEY
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: 'gpt-3.5-turbo',
      // max_tokens: 200,  // 応答内容が途中で切れるため使わない。
      temperature : 0.5,
      messages }),
  }

  const response = UrlFetchApp.fetch(openai_api_endpoint, options);
  if (response.getResponseCode() !== 200) {
    const text = JSON.parse(response.getContentText());
    const errorMessage = `エラ－：${text.error.message} (statusCode：${response.getResponseCode()})`;
    log(errorMessage);
    return errorMessage;
  }
  const json = JSON.parse(response.getContentText());
  return json['choices'][0]['message']['content'].trim();
}


// LINE bot Messaging API でユーザーの画面に ChatGPT の応答内容を表示。
function replyFromLinebot(replyToken, message) {
  const line_api_endpoint = 'https://api.line.me/v2/bot/message/reply';
  const options = {
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      authorization: 'Bearer ' + LINE_TOKEN,
    },
    muteHttpExceptions: true,
    method: 'POST',
    payload: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: message, }],
    }),
  };

  const response = UrlFetchApp.fetch(line_api_endpoint, options);
  if (response.getResponseCode() !== 200) {
    const text = response.getContentText();
    const errorMessage = `エラ－：${text} (statusCode：${response.getResponseCode()})`;
    throw new Error(errorMessage);
  }
}
