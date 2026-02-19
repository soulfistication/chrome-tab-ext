document.getElementById('save').addEventListener('click', async () => {
  const messageEl = document.getElementById('message');
  messageEl.className = 'message';
  messageEl.textContent = '';

  try {
    const tabs = await chrome.tabs.query({});
    const urls = tabs
      .filter(tab => tab.url && !tab.url.startsWith('chrome://'))
      .map(tab => tab.url);

    if (urls.length === 0) {
      messageEl.textContent = 'No tabs to save.';
      messageEl.classList.add('visible', 'error');
      return;
    }

    const content = urls.join('\n');
    const filename = 'tabs-' + new Date().toISOString().slice(0, 19).replace(/[:-]/g, '') + '.txt';

    await chrome.downloads.download({
      url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
      filename: filename,
      saveAs: true
    });

    messageEl.textContent = `Saved ${urls.length} tab${urls.length === 1 ? '' : 's'}.`;
    messageEl.classList.add('visible');
  } catch (err) {
    messageEl.textContent = 'Error: ' + (err.message || 'Could not save tabs.');
    messageEl.classList.add('visible', 'error');
  }
});
