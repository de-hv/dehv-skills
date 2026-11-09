() => {
  // The caller substitutes a JSON array for the placeholder on the next line:
  // [{ "selector": ".x" } or { "text": "Visible text" }, each with "label": "What changed"]
  // A selector outlines every visible match; the label appears once, with a count.
  const targets = __TARGETS__;
  const COLOR = '#E8590C';
  document.querySelectorAll('[data-dehv-hl]').forEach((n) => n.remove());

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const byText = (text) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let best = null;
    let bestArea = Infinity;
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!el || !walker.currentNode.textContent.includes(text) || el.closest('[data-dehv-hl]') || !visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < bestArea) { best = el; bestArea = r.width * r.height; }
    }
    return best ? [best] : [];
  };
  const docRect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  };
  const add = (styles, text) => {
    const n = document.createElement('div');
    n.setAttribute('data-dehv-hl', '');
    if (text) n.textContent = text;
    Object.assign(n.style, { position: 'absolute', pointerEvents: 'none', boxSizing: 'border-box' }, styles);
    document.body.appendChild(n);
    return n;
  };
  const tagStyle = {
    background: COLOR, color: '#fff', font: '600 12px/1.2 system-ui, sans-serif',
    padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', zIndex: '2147483647',
  };
  const pageWidth = document.documentElement.scrollWidth;
  const boxes = [];
  const placeTag = (tag, r) => {
    const w = tag.offsetWidth;
    const h = tag.offsetHeight;
    let left = r.x + r.w + 10;
    let top = r.y + Math.max(0, r.h / 2 - h / 2);
    if (left + w > pageWidth - 4) {            // no room on the right: go above, else below
      left = Math.max(4, Math.min(r.x - 4, pageWidth - w - 4));
      top = r.y - h - 8 >= 0 ? r.y - h - 8 : r.y + r.h + 8;
    }
    tag.style.left = `${left}px`;
    tag.style.top = `${top}px`;
    boxes.push({ x: left, y: top, w, h });
  };

  const result = { found: [], missing: [] };
  targets.forEach((t, i) => {
    const num = i + 1;
    const name = t.label || t.selector || t.text;
    let els = [];
    try { els = t.selector ? [...document.querySelectorAll(t.selector)].filter(visible) : []; } catch (e) { els = []; }
    if (!els.length && t.text) els = byText(t.text);
    if (!els.length) { result.missing.push(name); return; }

    els.forEach((el, j) => {
      const r = docRect(el);
      add({ left: `${r.x - 4}px`, top: `${r.y - 4}px`, width: `${r.w + 8}px`, height: `${r.h + 8}px`,
        border: `3px solid ${COLOR}`, borderRadius: '6px', zIndex: '2147483646' });
      boxes.push({ x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 });
      const text = j === 0 ? `${num}  ${name}${els.length > 1 ? ` (×${els.length})` : ''}` : `${num}`;
      placeTag(add(tagStyle, text), r);
    });
    result.found.push({ label: name, count: els.length });
  });

  // The region holding every outline and label, in page coordinates, for cropping.
  if (boxes.length) {
    const x1 = Math.min(...boxes.map((b) => b.x));
    const y1 = Math.min(...boxes.map((b) => b.y));
    const x2 = Math.max(...boxes.map((b) => b.x + b.w));
    const y2 = Math.max(...boxes.map((b) => b.y + b.h));
    result.region = { x: Math.round(x1), y: Math.round(y1), width: Math.round(x2 - x1), height: Math.round(y2 - y1) };
  }
  result.page = { width: pageWidth, height: document.documentElement.scrollHeight };
  return JSON.stringify(result);
}
