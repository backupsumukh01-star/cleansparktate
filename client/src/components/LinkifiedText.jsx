import { parseTextWithLinks } from '../utils/linkify';

export default function LinkifiedText({ text, isOwn }) {
  const parts = parseTextWithLinks(text);
  const linkClass = isOwn
    ? 'text-[#9fecdf] underline decoration-[#9fecdf]/80 underline-offset-2'
    : 'text-[#53bdeb] underline decoration-[#53bdeb]/80 underline-offset-2';

  const stopBubble = (e) => e.stopPropagation();

  return (
    <p className="text-[15px] leading-[1.35] whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.type === 'link') {
          return (
            <a
              key={`link-${i}-${part.href}`}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} active:opacity-70 cursor-pointer inline`}
              onClick={stopBubble}
              onTouchStart={stopBubble}
              onTouchEnd={stopBubble}
              onMouseDown={stopBubble}
            >
              {part.value}
            </a>
          );
        }
        return <span key={`text-${i}`}>{part.value}</span>;
      })}
    </p>
  );
}
