export function isLocalAppUrl(url, port) {
  try {
    return new URL(url).origin === `http://127.0.0.1:${port}`;
  } catch {
    return false;
  }
}

export function isTrustedDesktopSender(event, contents, port) {
  return Boolean(contents && event.sender === contents &&
    event.senderFrame === contents.mainFrame &&
    isLocalAppUrl(event.senderFrame?.url, port));
}

export function isExternalWebUrl(url) {
  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
