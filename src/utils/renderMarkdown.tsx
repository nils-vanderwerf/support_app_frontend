import React from 'react';

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b${match.index}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={`${keyPrefix}-i${match.index}`}>{match[2]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const HR_STYLE: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e8ddf5',
  margin: '6px 0 10px',
};

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      nodes.push(
        <div key={i} style={{ marginTop: '8px', marginBottom: '2px' }}>
          <strong style={{ fontSize: '1em' }}>{parseInline(line.slice(2), String(i))}</strong>
          <hr style={HR_STYLE} />
        </div>
      );
    } else if (line.startsWith('## ')) {
      nodes.push(
        <div key={i} style={{ marginTop: '14px', marginBottom: '2px' }}>
          <strong style={{ color: '#7B2FBE', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {parseInline(line.slice(3), String(i))}
          </strong>
          <hr style={HR_STYLE} />
        </div>
      );
    } else if (line.startsWith('### ')) {
      nodes.push(
        <div key={i} style={{ marginTop: '10px', marginBottom: '2px' }}>
          <strong style={{ fontSize: '0.9em' }}>{parseInline(line.slice(4), String(i))}</strong>
        </div>
      );
    } else if (/^[-*_]{3,}$/.test(line.trim())) {
      nodes.push(<hr key={i} style={HR_STYLE} />);
    } else if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '6px' }} />);
    } else {
      nodes.push(
        <div key={i}>{parseInline(line, String(i))}</div>
      );
    }
  });

  return <>{nodes}</>;
}
