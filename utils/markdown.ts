
export function markdownToHtml(markdown: string): string {
    let html = markdown;

    // Headings (ordered from H6 to H1 to avoid partial matching issues)
    html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-heading text-brand-secondary mb-1 mt-2 uppercase tracking-wide font-bold">$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5 class="text-base font-heading text-brand-secondary mb-1 mt-3 font-bold">$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-heading text-brand-secondary mb-2 mt-4 font-bold">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-heading text-brand-secondary mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-heading text-brand-primary mb-3 mt-5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-heading text-brand-primary mb-4 mt-6">$1</h1>');

    // Bold/Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Blockquotes
    html = html.replace(/^> (.*)$/gm, '<blockquote class="border-l-4 border-brand-primary bg-amber-50 p-4 my-4 italic">$1</blockquote>');

    // Lists
    html = html.replace(/^\s*\n\*/gm, '\n*'); // Fix newlines
    html = html.replace(/^(\s*)\* (.*)/gm, '$1<li class="mb-2 ml-4 pl-2">$2</li>');
    html = html.replace(/<\/li>\s*<li/g, '</li><li'); // Join list items
    const wrapLists = (text: string) => text.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc list-inside mb-4">$1</ul>');
    html = wrapLists(html);
    
    // Special list styling for Pros/Cons
    html = html.replace(/<h2.*>Pros.*<\/h2>\s*<ul/g, '<h2 class="text-2xl font-heading text-brand-success mb-3 mt-5">Pros (What Riders Love)</h2><ul class="list-none mb-4"');
    html = html.replace(/<h2.*>Cons.*<\/h2>\s*<ul/g, '<h2 class="text-2xl font-heading text-brand-error mb-3 mt-5">Cons (Areas for Improvement)</h2><ul class="list-none mb-4"');
    html = html.replace(/<h2.*>Pros.*<\/h2>[\s\S]*?<li/g, (match) => match.replace(/<li/g, '<li class="flex items-start mb-2"><span class="text-brand-success mr-3 text-xl">✔</span><span class="flex-1">'));
    html = html.replace(/<h2.*>Cons.*<\/h2>[\s\S]*?<li/g, (match) => match.replace(/<li/g, '<li class="flex items-start mb-2"><span class="text-brand-error mr-3 text-xl">✖</span><span class="flex-1">'));
    html = html.replace(/((?:<span class="flex-1">)[\s\S]*?)<\/li>/g, '$1</span></li>');

    // Tables
    html = html.replace(/^\|(.+)\|\s*\n\|( *[-:]+[-| :]*)\|\s*\n((?:\|.*\|\s*\n?)*)/gm, (match, headerRow, separatorRow, contentRows) => {
        const headers = headerRow.split('|').slice(1, -1).map(h => `<th class="p-3 text-left bg-brand-secondary text-white">${h.trim()}</th>`).join('');
        const rows = contentRows.trim().split('\n').map(row => {
            const cells = row.split('|').slice(1, -1).map(c => `<td class="p-3 border-t border-gray-200">${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse border border-gray-200"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    });

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-secondary-dark hover:text-brand-primary underline">$1</a>');

    // Cleanup: Remove any remaining standalone "social" hashtags (e.g. #ebike #review)
    // We only match words preceded by a space or line start and starting with #
    html = html.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1$2');

    // Paragraphs
    html = html.split('\n').map(p => p.trim()).filter(p => p.length > 0)
        .map(p => {
            if (p.startsWith('<') && p.endsWith('>')) {
                return p; // It's already HTML
            }
            return `<p class="mb-4">${p}</p>`;
        }).join('');
    
    // Cleanup paragraphs around lists/tables/headings
    html = html.replace(/<\/p><(ul|div|h[1-6])/g, '<$1');
    html = html.replace(/<(\/ul|\/div|\/h[1-6])><p>/g, '<$1>');

    return `<div class="prose max-w-none">${html}</div>`;
}
