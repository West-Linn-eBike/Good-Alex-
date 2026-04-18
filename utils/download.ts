
// This dynamic import is necessary because these are not standard dependencies.
// They are loaded from a CDN via an import map in index.html.
const loadJspdf = () => import('jspdf');
const loadHtml2canvas = () => import('html2canvas');

export function getFileNameBase(reviewMarkdown: string | null): string {
    if (reviewMarkdown) {
       // Try specific review format first (e.g. "# ModelName Review")
       const reviewTitleMatch = reviewMarkdown.match(/^# (.*?)(?::|\sReview)/);
       if (reviewTitleMatch && reviewTitleMatch[1]) {
           return `${reviewTitleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
       }

       // Fallback: Use the entire H1 content if it doesn't match the specific review pattern
       // This supports generic articles like "# The Safety Guide to Batteries"
       const h1Match = reviewMarkdown.match(/^# (.*)$/m);
       if (h1Match && h1Match[1]) {
           return h1Match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
       }
    }
    return "generated-content";
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function downloadPdf(element: HTMLElement, fileNameBase: string) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.innerText = 'Generating PDF...';
    loadingIndicator.className = 'fixed top-4 right-4 bg-brand-primary text-white p-3 rounded-lg shadow-lg z-50';
    document.body.appendChild(loadingIndicator);

    try {
        const { jsPDF } = await loadJspdf();
        const html2canvas = (await loadHtml2canvas()).default;

        const pdf = new jsPDF("p", "pt", "a4");
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff' // Ensure canvas background is white
        });
        
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const imgWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${fileNameBase}.pdf`);
    } catch (err: any) {
        console.error("Error generating PDF:", err);
        alert(`Failed to generate PDF: ${err.message}`);
    } finally {
        document.body.removeChild(loadingIndicator);
    }
}
