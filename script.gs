const properties = PropertiesService.getScriptProperties().getProperties();
const LINE_TOKEN = properties['LINE_TOKEN'];
const APIKEY = properties['APIKEY'];
const cache = CacheService.getDocumentCache();
const postscript = '正規版ではここにスクリプトが入ります。;

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
    return replyFromLinebot(replyToken, '正規版ではここにスクリプトが入ります。');
  
  if (inputText.length < 2) 
    return replyFromLinebot(replyToken, '正規版ではここにスクリプトが入ります。');
  
  if (inputText[0] !== '@') {
   
    initializeMessages();
  
}
  const messages = updateMessages('user', inputText + postscript);

  updateMessages('assistant', answer);
  
  return replyFromLinebot(replyToken, answer);
}
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
      // max_tokens: 200, 
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
