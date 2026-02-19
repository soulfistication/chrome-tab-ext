const messageEl = document.getElementById('message');

function showMessage(text, isError = false) {
  messageEl.className = 'message visible' + (isError ? ' error' : '');
  messageEl.textContent = text;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const lastDash = trimmed.lastIndexOf(' - ');
  const url = lastDash >= 0 ? trimmed.slice(lastDash + 3).trim() : trimmed;
  if (!url || url.startsWith('chrome://')) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

document.getElementById('save').addEventListener('click', async () => {
  messageEl.className = 'message';
  messageEl.textContent = '';

  try {
    const tabs = await chrome.tabs.query({});
    const lines = tabs
      .filter(tab => tab.url && !tab.url.startsWith('chrome://'))
      .map(tab => {
        const title = (tab.title || '').trim() || '(no title)';
        return `${title} - ${tab.url}`;
      });

    if (lines.length === 0) {
      showMessage('No tabs to save.', true);
      return;
    }

    const content = lines.join('\n');
    const filename = 'tabs-' + new Date().toISOString().slice(0, 19).replace(/[:-]/g, '') + '.txt';

    await chrome.downloads.download({
      url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
      filename: filename,
      saveAs: true
    });

    showMessage(`Saved ${lines.length} tab${lines.length === 1 ? '' : 's'}.`);
  } catch (err) {
    showMessage('Error: ' + (err.message || 'Could not save tabs.'), true);
  }
});

document.getElementById('import').addEventListener('click', () => {
  document.getElementById('file').click();
});

document.getElementById('file').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  messageEl.className = 'message';
  messageEl.textContent = '';

  if (!file) return;

  try {
    const text = await file.text();
    const urls = text
      .split(/\r?\n/)
      .map(parseLine)
      .filter(Boolean);

    if (urls.length === 0) {
      showMessage('No valid URLs found in the file.', true);
      return;
    }

    for (const url of urls) {
      await chrome.tabs.create({ url });
    }

    showMessage(`Opened ${urls.length} tab${urls.length === 1 ? '' : 's'}.`);
  } catch (err) {
    showMessage('Error: ' + (err.message || 'Could not read file.'), true);
  }
});
