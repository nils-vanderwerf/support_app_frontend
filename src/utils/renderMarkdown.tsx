import React from 'react';

/**
 * Renders a subset of markdown inline: **bold**, *italic*, and newlines.
 * Returns an array of React nodes safe to embed inside a Typography component.
 */
export function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').flatMap((line, lineIdx, lines) => {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      if (match[1] !== undefined) {
        parts.push(<strong key={`${lineIdx}-${match.index}`}>{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        parts.push(<em key={`${lineIdx}-${match.index}`}>{match[2]}</em>);
      }
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));

    if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
    return parts;
  });
}
