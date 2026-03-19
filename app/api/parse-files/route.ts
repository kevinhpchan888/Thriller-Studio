import JSZip from 'jszip';

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseEpub(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const textParts: string[] = [];

  // Find the OPF file to get reading order
  let opfPath = '';
  const containerXml = zip.file('META-INF/container.xml');
  if (containerXml) {
    const containerText = await containerXml.async('text');
    const match = containerText.match(/full-path="([^"]+\.opf)"/);
    if (match) opfPath = match[1];
  }

  // Get spine order from OPF
  const orderedFiles: string[] = [];
  if (opfPath) {
    const opfFile = zip.file(opfPath);
    if (opfFile) {
      const opfText = await opfFile.async('text');
      const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

      // Extract manifest items
      const manifest: Record<string, string> = {};
      const itemRegex = /<item\s[^>]*id="([^"]*)"[^>]*href="([^"]*)"[^>]*\/?\s*>/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(opfText)) !== null) {
        manifest[itemMatch[1]] = opfDir + itemMatch[2];
      }

      // Extract spine order
      const spineRegex = /<itemref\s[^>]*idref="([^"]*)"[^>]*\/?\s*>/g;
      let spineMatch;
      while ((spineMatch = spineRegex.exec(opfText)) !== null) {
        const href = manifest[spineMatch[1]];
        if (href) orderedFiles.push(href);
      }
    }
  }

  // If we got spine order, use it; otherwise fall back to all xhtml/html files
  const filesToRead = orderedFiles.length > 0
    ? orderedFiles
    : Object.keys(zip.files).filter(f => /\.(xhtml|html|htm)$/i.test(f)).sort();

  for (const filePath of filesToRead) {
    const file = zip.file(filePath);
    if (file) {
      const html = await file.async('text');
      const text = stripHtml(html);
      if (text.length > 20) {
        textParts.push(text);
      }
    }
  }

  return textParts.join('\n\n');
}

async function parseTxt(buffer: ArrayBuffer): Promise<string> {
  return new TextDecoder('utf-8').decode(buffer);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    const results: { name: string; text: string; error?: string }[] = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        let text = '';

        if (file.name.endsWith('.epub')) {
          text = await parseEpub(buffer);
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          text = await parseTxt(buffer);
        } else {
          // Try as plain text
          text = await parseTxt(buffer);
        }

        results.push({ name: file.name, text });
      } catch (err) {
        results.push({ name: file.name, text: '', error: String(err) });
      }
    }

    return Response.json({ files: results });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
