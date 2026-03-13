import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let lineText = '';

    for (const item of content.items) {
      if ('str' in item && item.str) {
        const y = Math.round((item as { transform: number[] }).transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          fullText += lineText + '\n';
          lineText = '';
        } else if (lastY !== null && lineText && !lineText.endsWith(' ')) {
          lineText += ' ';
        }
        lineText += (item as { str: string }).str;
        lastY = y;
      }
    }
    if (lineText) fullText += lineText + '\n';
    fullText += '\n';
  }

  return fullText;
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractTextFromPdf(file);
  if (name.endsWith('.docx')) return extractTextFromDocx(file);
  throw new Error('Format non supporté. Utilisez PDF ou DOCX.');
}
