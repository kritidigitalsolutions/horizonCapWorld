import React from 'react';
import { RiLightbulbLine } from 'react-icons/ri';

/**
 * Formats inline markdown and HTML tags safely:
 * - 4 or 2-3 asterisks: ****bold**** or **bold**
 * - Underline: <u>text</u>
 * - Italic: *italic* or _italic_
 * - Strikethrough: ~~del~~
 * - Highlight: ==highlight==
 * - Code: `code`
 * - Links: [text](url)
 */
export function formatInlineText(text) {
  if (!text) return '';
  return text
    // Handle 4 asterisks or 2-3 asterisks for bold
    .replace(/\*{2,4}([\s\S]+?)\*{2,4}/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Handle HTML <u> underline
    .replace(/<u>([\s\S]+?)<\/u>/gi, '<u class="underline underline-offset-4 decoration-gold-500 decoration-2 font-semibold text-slate-900">$1</u>')
    // Handle italic with single asterisk (*text*)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-slate-800">$1</em>')
    // Handle italic with underscore (_text_)
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em class="italic text-slate-800">$1</em>')
    // Strikethrough
    .replace(/~~([\s\S]+?)~~/g, '<del class="line-through text-slate-400">$1</del>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-amber-800 font-medium">$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold-600 underline font-semibold hover:text-gold-800 transition-colors">$1</a>')
    // Highlight ==text==
    .replace(/==([^=]+)==/g, '<mark class="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-medium">$1</mark>');
}

/**
 * Robust, full-featured markdown block parser and renderer
 */
export default function ArticleContentRenderer({ content, className = '' }) {
  if (!content) return null;

  // Split into double-newline separated paragraph blocks
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 space-y-4 ${className}`}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-lg sm:text-xl font-bold text-slate-900 font-poppins mt-6 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2"
            >
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed.replace(/^##\s+/, '')) }} />
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={index}
              className="text-base sm:text-lg font-bold text-slate-900 font-poppins mt-5 mb-2.5 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed.replace(/^###\s+/, '')) }} />
            </h3>
          );
        }

        // Heading 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={index}
              className="text-sm font-bold text-slate-900 font-poppins mt-4 mb-2"
            >
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed.replace(/^####\s+/, '')) }} />
            </h4>
          );
        }

        // Horizontal Divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={index} className="my-6 border-slate-200" />;
        }

        // Callout Box (starts with > and has callout/tip keyword)
        const isCallout =
          trimmed.startsWith('>') &&
          (trimmed.toLowerCase().includes('pro tip') ||
            trimmed.toLowerCase().includes('callout') ||
            trimmed.toLowerCase().includes('important') ||
            trimmed.toLowerCase().includes('note:'));

        if (isCallout) {
          const cleanText = trimmed.replace(/^>\s*/gm, '').trim();
          return (
            <div
              key={index}
              className="my-5 p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-gold-50/40 to-white rounded-2xl border border-amber-200/90 shadow-2xs flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
                <RiLightbulbLine size={18} />
              </div>
              <div className="flex-1 text-xs sm:text-sm text-slate-800 leading-relaxed font-poppins">
                {cleanText.split('\n').map((l, lIdx, arr) => (
                  <React.Fragment key={lIdx}>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(l) }} />
                    {lIdx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        }

        // Standard Blockquote
        if (trimmed.startsWith('>')) {
          const quoteText = trimmed.replace(/^>\s*/gm, '').trim();
          return (
            <blockquote
              key={index}
              className="my-5 p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-gold-50/20 to-white rounded-2xl border-l-4 border-gold-400 text-slate-800 italic font-medium leading-relaxed shadow-2xs text-xs sm:text-sm"
            >
              {quoteText.split('\n').map((l, lIdx, arr) => (
                <React.Fragment key={lIdx}>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineText(l) }} />
                  {lIdx < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </blockquote>
          );
        }

        // Numbered / Ordered List (e.g. 1. Title \n Description)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = [];
          const lines = trimmed.split('\n');
          let currentNum = '1';
          let currentLines = [];

          lines.forEach((line) => {
            const match = line.match(/^(\d+)\.\s+(.*)/);
            if (match) {
              if (currentLines.length > 0) {
                items.push({ num: currentNum, lines: currentLines });
              }
              currentNum = match[1];
              currentLines = [match[2]];
            } else {
              currentLines.push(line);
            }
          });
          if (currentLines.length > 0) {
            items.push({ num: currentNum, lines: currentLines });
          }

          return (
            <ol key={index} className="my-4 space-y-3">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-gold-400 text-slate-950 font-black text-[11px] flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
                    {item.num}
                  </span>
                  <div className="flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-poppins">
                    {item.lines.map((l, lIdx) => (
                      <React.Fragment key={lIdx}>
                        <span dangerouslySetInnerHTML={{ __html: formatInlineText(l) }} />
                        {lIdx < item.lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        // Unordered Bullet List (starts with - or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n(?=[-|\*]\s+)/).filter(Boolean);
          return (
            <ul key={index} className="my-3 space-y-2 text-xs sm:text-sm text-slate-700 font-poppins">
              {items.map((item, iIndex) => {
                const cleanItem = item.replace(/^[-|\*]\s+/, '').trim();
                return (
                  <li key={iIndex} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      {cleanItem.split('\n').map((l, lIdx, arr) => (
                        <React.Fragment key={lIdx}>
                          <span dangerouslySetInnerHTML={{ __html: formatInlineText(l) }} />
                          {lIdx < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph with multi-line preservation
        const paragraphLines = trimmed.split('\n');
        return (
          <p key={index} className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal mb-4 font-poppins">
            {paragraphLines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                <span dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />
                {lIdx < paragraphLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
