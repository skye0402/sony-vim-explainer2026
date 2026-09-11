// Renders architecture/architecture.md as architecture/architecture.html, styled like the explainer.
// Usage: npm run build
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(join(root, file), 'utf8');
const escapeHtml = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Diagram colours follow the explainer. Arial keeps label widths the same wherever the page is opened.
const mermaidConfig = {
  theme: 'base',
  htmlLabels: false,
  flowchart: { htmlLabels: false, curve: 'basis', padding: 12, nodeSpacing: 30, rankSpacing: 44, wrappingWidth: 160 },
  themeVariables: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '16px',
    primaryColor: '#ffffff',
    primaryBorderColor: '#c4b2ff',
    primaryTextColor: '#20303e',
    lineColor: '#9a82f4',
    clusterBkg: '#f1ecff',
    clusterBorder: '#d8ccff',
    titleColor: '#6538ff',
    edgeLabelBackground: '#faf8ff',
  },
};

// Pre-render diagrams to inline SVG so the page needs no scripts or network access.
function renderMermaid(source) {
  const dir = mkdtempSync(join(tmpdir(), 'architecture-diagram-'));
  try {
    writeFileSync(join(dir, 'diagram.mmd'), source.replaceAll('\\n', '<br/>'));
    writeFileSync(join(dir, 'config.json'), JSON.stringify(mermaidConfig));
    execFileSync(join(root, 'node_modules/.bin/mmdc'), ['-q', '-i', 'diagram.mmd', '-o', 'diagram.svg', '-c', 'config.json', '-b', 'transparent'], { cwd: dir, stdio: 'inherit' });
    return readFileSync(join(dir, 'diagram.svg'), 'utf8').replace(/^<\?xml[^>]*>\s*/, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

let currentSection;
const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      if (lang !== 'mermaid') return false;
      return `<figure class="diagram"><div class="scene-head"><span class="eyebrow"><span class="dot"></span>${escapeHtml(currentSection.title)}</span><button class="pill enlarge" type="button">View larger ⛶</button></div><div class="diagram-body" title="View larger">${renderMermaid(text)}</div></figure>`;
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      // Source files under ../docs are not published, so keep their names without dead links.
      if (href.startsWith('../docs/')) return `<span class="source-file">${label}</span>`;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${label}</a>`;
    },
  },
});

let title = '';
let meta = [];
const sections = [];
for (const token of marked.lexer(read('architecture/architecture.md'))) {
  if (token.type === 'heading' && token.depth === 1) {
    title = token.text;
  } else if (token.type === 'heading' && token.depth === 2) {
    const match = token.text.match(/^(\d+)\.\s*(.+)$/);
    const name = match ? match[2] : token.text;
    sections.push({ number: (match ? match[1] : String(sections.length + 1)).padStart(2, '0'), title: name, id: slugify(name), tokens: [] });
  } else if (sections.length) {
    sections.at(-1).tokens.push(token);
  } else if (token.type === 'paragraph') {
    meta = token.text.split('|').map(part => part.trim());
  }
}

const total = String(sections.length).padStart(2, '0');
const sectionHtml = sections.map(section => {
  currentSection = section;
  const html = marked.parser(section.tokens)
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>')
    .replace(/<li><strong>(S\d+):<\/strong>/g, (_, id) => `<li id="source-${id.toLowerCase()}"><strong>${id}:</strong>`)
    // Citations such as [S3, pages 6, 18] become chips that jump to the source note.
    .replace(/\[(S\d+(?:, S\d+)*)((?:, [^\]]+)?)\]/g, (_, ids, detail) =>
      `<span class="cite">${ids.split(', ').map(id => `<a href="#source-${id.toLowerCase()}">${id}</a>`).join(', ')}${detail}</span>`);
  return `<section class="doc-section" id="${section.id}"><div class="eyebrow"><span class="blue">${section.number} / ${total}</span></div><h2>${escapeHtml(section.title)}</h2>\n${html}</section>`;
}).join('\n');

const [lead, tail] = title.split(/:\s+(.+)/);
const logo = read('architecture/sonylogo.svg');
const values = {
  PAGE_TITLE: 'Sony · Target architecture',
  LOGO: `<svg viewBox="${logo.match(/viewBox="([^"]+)"/)[1]}" role="img" aria-label="SONY"><path fill="#000" d="${logo.match(/\sd="([^"]+)"/)[1].replace(/\s+/g, ' ')}"/></svg>`,
  VERSION: escapeHtml(meta[0] ?? ''),
  HEADLINE: tail ? `${escapeHtml(lead)}:<br><em>${escapeHtml(tail)}</em>` : escapeHtml(title),
  META: escapeHtml(meta.slice(1).join(' · ')),
  TOC: sections.map(s => `<a href="#${s.id}"><b>${s.number}</b><span>${escapeHtml(s.title)}</span></a>`).join(''),
  SECTION_COUNT: String(sections.length),
  SECTIONS: sectionHtml,
};
const page = read('scripts/architecture-template.html').replace(/{{(\w+)}}/g, (_, key) => values[key]);
writeFileSync(join(root, 'architecture/architecture.html'), page);
console.log(`architecture/architecture.html: ${sections.length} sections, ${Math.round(page.length / 1024)} KB`);
