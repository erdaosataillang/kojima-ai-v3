function getInitialMessages() {
  return [{  "role": "system", "content": "ここに正規版ではスクリプトが組み込まれます。"}
function getMessages() {
  const mes = cache.get("messages");
  if (mes == null) {
    return getInitialMessages();
  }
  return JSON.parse(mes);
}
function initializeMessages() {
  cache.remove("messages");
}
function updateMessages(role, content) {
  const messages = getMessages();
  messages.push({ role, content });
  cache.put("messages", JSON.stringify(messages), 21600);
  return messages;
}
