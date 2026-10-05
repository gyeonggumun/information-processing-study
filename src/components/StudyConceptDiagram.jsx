import { useId } from 'react';

const colors = {
  blue: '#2779e8',
  violet: '#7a62dc',
  cyan: '#119ca5',
  orange: '#e9873b',
  green: '#26a269',
};

const positions = [
  { x: 25, y: 25, fromX: 380, fromY: 230, toX: 325, toY: 175 },
  { x: 675, y: 25, fromX: 620, fromY: 230, toX: 675, toY: 175 },
  { x: 25, y: 375, fromX: 380, fromY: 320, toX: 325, toY: 375 },
  { x: 675, y: 375, fromX: 620, fromY: 320, toX: 675, toY: 375 },
];

function wrapText(value, maxUnits, maxLines) {
  const measure = (text) => Array.from(text).reduce((total, character) => total + (character.codePointAt(0) > 0xff ? 2 : 1), 0);
  const words = value.trim().split(/\s+/).flatMap((word) => {
    if (measure(word) <= maxUnits) return [word];
    const parts = [];
    let part = '';
    for (const character of word) {
      if (measure(part + character) > maxUnits) {
        parts.push(part);
        part = '';
      }
      part += character;
    }
    if (part) parts.push(part);
    return parts;
  });
  const lines = [];
  let line = '';
  let truncated = false;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) > maxUnits && line) {
      lines.push(line);
      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
      line = word;
    } else {
      line = next;
    }
  }
  if (!truncated && line) lines.push(line);
  if (truncated) {
    const last = lines.length - 1;
    lines[last] = `${lines[last].slice(0, -1)}…`;
  }
  return lines;
}

function TextLines({ lines, x, y, lineHeight, ...props }) {
  return <text x={x} y={y} {...props}>{lines.map((line, index) => <tspan x={x} dy={index === 0 ? 0 : lineHeight} key={index}>{line}</tspan>)}</text>;
}

export default function StudyConceptDiagram({ visual }) {
  const titleId = useId();
  const accent = colors[visual.color] ?? colors.blue;
  const titleLines = wrapText(visual.title, 34, 2);

  return (
    <svg className="study-concept-svg" viewBox="0 0 1000 550" role="img" aria-labelledby={titleId} xmlns="http://www.w3.org/2000/svg">
      <title id={titleId}>{visual.title} 핵심 개념 관계도</title>
      <desc>{visual.items.map((item) => `${item.name}: ${item.meaning}`).join(' / ')}</desc>
      <rect width="1000" height="550" rx="18" fill="#f7faff" />
      {visual.items.map((item, index) => {
        const slot = positions[index];
        return <path key={`line-${item.name}`} d={`M ${slot.fromX} ${slot.fromY} L ${slot.toX} ${slot.toY}`} fill="none" stroke={accent} strokeOpacity=".45" strokeWidth="3" />;
      })}
      <rect x="350" y="230" width="300" height="90" rx="18" fill={accent} />
      <text x="500" y="257" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">핵심 주제</text>
      <TextLines lines={titleLines} x={500} y={titleLines.length === 1 ? 290 : 281} lineHeight={22} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" />
      {visual.items.map((item, index) => {
        const { x, y } = positions[index];
        const nameLines = wrapText(item.name, 30, 3);
        const meaningLines = wrapText(item.meaning, 40, 2);
        return (
          <g key={item.name}>
            <rect x={x} y={y} width="300" height="150" rx="15" fill="#fff" stroke="#d8e5f5" strokeWidth="2" />
            <rect x={x} y={y} width="7" height="150" rx="3" fill={accent} />
            <TextLines lines={nameLines} x={x + 20} y={y + 31} lineHeight={20} fill="#172b47" fontSize="16" fontWeight="800" />
            <TextLines lines={meaningLines} x={x + 20} y={y + 100} lineHeight={19} fill="#52647c" fontSize="13" />
          </g>
        );
      })}
    </svg>
  );
}
