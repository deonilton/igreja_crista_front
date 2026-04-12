/**
 * Imprime um nó em iframe (about:blank) para reduzir URL da SPA nos cabeçalhos do Chrome.
 */
export function printElementInIframe(printRoot: HTMLElement, iframePrintCss: string, obsPrintClass = 'pastoral-obs-print') {
  const clone = printRoot.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('textarea').forEach((ta) => {
    const text = (ta as HTMLTextAreaElement).value;
    const div = document.createElement('div');
    div.className = obsPrintClass;
    div.textContent = text;
    ta.replaceWith(div);
  });

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>&#8203;</title><style>${iframePrintCss}</style></head><body>${clone.outerHTML}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.title = 'Impressão';
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return;
  }

  const doc = win.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    win.removeEventListener('afterprint', cleanup);
    iframe.remove();
  };

  win.addEventListener('afterprint', cleanup);
  win.focus();

  const printWhenReady = () => {
    try {
      win.print();
    } finally {
      setTimeout(cleanup, 60_000);
    }
  };

  if (doc.readyState === 'complete') {
    printWhenReady();
  } else {
    win.onload = printWhenReady;
  }
}
