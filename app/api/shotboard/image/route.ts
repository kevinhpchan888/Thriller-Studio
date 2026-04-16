import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const PRODUCTION_DIR = join(process.cwd(), 'production', 'output');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get('project');
  const file = searchParams.get('file');

  if (!project || !file) {
    return Response.json({ error: 'Missing project or file parameter' }, { status: 400 });
  }

  // Prevent directory traversal
  if (project.includes('..') || file.includes('..') || project.includes('/') || file.includes('/')) {
    return Response.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = join(PRODUCTION_DIR, project, file);

  if (!existsSync(filePath)) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  const data = await readFile(filePath);
  const ext = file.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };

  return new Response(data, {
    headers: {
      'Content-Type': mimeMap[ext || 'png'] || 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
