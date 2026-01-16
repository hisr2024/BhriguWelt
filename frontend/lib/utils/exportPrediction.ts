import type { ParsedPrediction, ExportFormat } from '@/lib/types/predictions';

/**
 * Export prediction to various formats
 */
export async function exportPrediction(
  prediction: ParsedPrediction,
  format: ExportFormat,
  elementId?: string
): Promise<void> {
  switch (format) {
    case 'txt':
      exportAsText(prediction);
      break;
    case 'markdown':
      exportAsMarkdown(prediction);
      break;
    case 'pdf':
      await exportAsPDF(prediction);
      break;
    case 'json':
      exportAsJSON(prediction);
      break;
    case 'image':
    case 'png':
      await exportAsImage(prediction, elementId);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
}

/**
 * Export as plain text
 */
function exportAsText(prediction: ParsedPrediction): void {
  const content = `
${prediction.category}
${'='.repeat(prediction.category.length)}

Generated: ${new Date(prediction.generatedAt).toLocaleString()}
Confidence: ${Math.round(prediction.confidence * 100)}%

KEY INSIGHTS
${'-'.repeat(50)}
${prediction.summary}

DETAILED ANALYSIS
${'-'.repeat(50)}
${prediction.sections.map(section => `
${section.title}
${'-'.repeat(section.title.length)}
${section.content}
`).join('\n')}

---
This prediction was generated using Vedic astrology principles.
For spiritual guidance and self-reflection purposes only.
`.trim();

  downloadFile(
    content,
    `${slugify(prediction.category)}.txt`,
    'text/plain'
  );
}

/**
 * Export as Markdown
 */
function exportAsMarkdown(prediction: ParsedPrediction): void {
  const content = `
# ${prediction.category}

**Generated:** ${new Date(prediction.generatedAt).toLocaleString()}
**Confidence:** ${Math.round(prediction.confidence * 100)}%

---

## 💡 Key Insights

${prediction.summary}

---

## 📊 Detailed Analysis

${prediction.sections.map(section => `
### ${section.title}

${section.content}

${section.confidence ? `*Confidence: ${Math.round(section.confidence * 100)}%*` : ''}
`).join('\n')}

---

> **Note:** This prediction is based on Vedic astrology principles and ancient texts.
> Use for spiritual guidance and self-reflection purposes only.
`.trim();

  downloadFile(
    content,
    `${slugify(prediction.category)}.md`,
    'text/markdown'
  );
}

/**
 * Export as PDF (requires jsPDF library)
 */
async function exportAsPDF(prediction: ParsedPrediction): Promise<void> {
  try {
    // Dynamic import to reduce bundle size
    const jsPDF = (await import('jspdf')).default;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(prediction.category, margin, y);
    y += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(
      `Generated: ${new Date(prediction.generatedAt).toLocaleString()}`,
      margin,
      y
    );
    y += 6;
    doc.text(
      `Confidence: ${Math.round(prediction.confidence * 100)}%`,
      margin,
      y
    );
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Key Insights', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(
      prediction.summary,
      pageWidth - 2 * margin
    );
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 6 + 10;

    // Sections
    prediction.sections.forEach((section) => {
      // Check if we need a new page
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(
        section.content,
        pageWidth - 2 * margin
      );
      doc.text(contentLines, margin, y);
      y += contentLines.length * 6 + 10;
    });

    // Footer
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'This prediction is based on Vedic astrology principles. For spiritual guidance only.',
      margin,
      pageHeight - 15
    );

    doc.save(`${slugify(prediction.category)}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('PDF export requires the jsPDF library. Falling back to text export.');
    exportAsText(prediction);
  }
}

/**
 * Export as JSON
 */
function exportAsJSON(prediction: ParsedPrediction): void {
  const content = JSON.stringify(prediction, null, 2);
  downloadFile(
    content,
    `${slugify(prediction.category)}.json`,
    'application/json'
  );
}

/**
 * Export as Image/PNG (requires html2canvas library)
 * @param prediction - The prediction data
 * @param elementId - Optional ID of element to capture. If not provided, captures entire prediction container
 */
async function exportAsImage(prediction: ParsedPrediction, elementId?: string): Promise<void> {
  try {
    // Dynamic import to reduce bundle size
    const html2canvas = (await import('html2canvas')).default;

    // Find the element to capture
    const element = elementId
      ? document.getElementById(elementId)
      : document.querySelector('[data-prediction-container]') || document.querySelector('main');

    if (!element) {
      throw new Error('Could not find element to capture');
    }

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.textContent = 'Generating image...';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; z-index: 10000;';
    document.body.appendChild(loadingDiv);

    // Capture the element
    const canvas = await html2canvas(element as HTMLElement, {
      backgroundColor: '#1a1a2e', // Match app background
      scale: 2, // Higher resolution
      logging: false,
      useCORS: true, // Allow cross-origin images
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Remove loading indicator
    document.body.removeChild(loadingDiv);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image');
      }

      // Download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(prediction.category)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');

  } catch (error) {
    console.error('Image export failed:', error);
    alert('Image export failed. Please try a different format or ensure all content is loaded.');
  }
}

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Convert string to slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
