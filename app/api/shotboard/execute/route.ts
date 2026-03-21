import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { createSSEResponse } from '@/lib/sse-helpers';
import { buildPromptForAction } from '@/lib/prompts/shotboard-agent';
import type { ShotBoardExecuteRequest } from '@/types/pipeline';

const PRODUCTION_DIR = join(process.cwd(), 'production', 'output');

export async function POST(request: Request) {
  const body: ShotBoardExecuteRequest = await request.json();
  const { action, shotIndex, concept, shot, projectSlug, correctionPrompt, sourceImagePath } = body;

  // Ensure output directory exists
  const projectDir = join(PRODUCTION_DIR, projectSlug);
  await mkdir(projectDir, { recursive: true });

  // Determine version number from existing files
  const versionId = Date.now();
  const filename = `shot-${String(shotIndex + 1).padStart(3, '0')}-v${versionId}.png`;
  const outputPath = join(projectDir, filename);

  // Build the Claude Code prompt
  const agentPrompt = buildPromptForAction(action, concept, shot, outputPath, {
    correctionPrompt,
    sourceImagePath,
  });

  return createSSEResponse(async (sse) => {
    sse.send('progress', {
      status: 'starting',
      message: `Starting ${action} for shot #${shotIndex + 1}...`,
      shotIndex,
    });

    try {
      const result = await runClaudeCode(agentPrompt, (chunk) => {
        // Parse Claude Code output for progress indicators
        if (chunk.includes('Workflow submitted') || chunk.includes('POST') && chunk.includes('/prompt')) {
          sse.send('progress', { status: 'queued', message: 'Workflow submitted to ComfyUI', shotIndex });
        } else if (chunk.includes('Step') || chunk.includes('step')) {
          sse.send('progress', { status: 'generating', message: chunk.trim(), shotIndex });
        } else if (chunk.includes('Downloading') || chunk.includes('Saving')) {
          sse.send('progress', { status: 'downloading', message: 'Downloading result...', shotIndex });
        }
      });

      // Check for RESULT: or ERROR: in the output
      const resultMatch = result.match(/RESULT:(.+)/);
      const errorMatch = result.match(/ERROR:(.+)/);

      if (resultMatch) {
        const imagePath = resultMatch[1].trim();
        const relativeUrl = `/api/shotboard/image?project=${encodeURIComponent(projectSlug)}&file=${encodeURIComponent(filename)}`;
        sse.send('complete', {
          status: 'done',
          shotIndex,
          imagePath,
          imageUrl: relativeUrl,
          filename,
          versionId: String(versionId),
        });
      } else if (errorMatch) {
        sse.send('error', {
          status: 'failed',
          shotIndex,
          message: errorMatch[1].trim(),
        });
      } else {
        // Claude Code finished without explicit RESULT/ERROR — check if file exists
        sse.send('complete', {
          status: 'done',
          shotIndex,
          imagePath: outputPath,
          imageUrl: `/api/shotboard/image?project=${encodeURIComponent(projectSlug)}&file=${encodeURIComponent(filename)}`,
          filename,
          versionId: String(versionId),
          note: 'Claude Code completed — verify output manually',
        });
      }
    } catch (err) {
      sse.send('error', {
        status: 'failed',
        shotIndex,
        message: String(err),
      });
    }

    sse.close();
  });
}

function runClaudeCode(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['--print', '--output-format', 'text'], {
      shell: true,
      env: { ...process.env },
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      onChunk(chunk);
    });

    proc.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code: number | null) => {
      if (code === 0 || output.includes('RESULT:')) {
        resolve(output);
      } else {
        reject(new Error(`Claude Code exited with code ${code}: ${errorOutput || output}`));
      }
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn Claude Code: ${err.message}. Is 'claude' on your PATH?`));
    });

    // Send the prompt via stdin
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}
