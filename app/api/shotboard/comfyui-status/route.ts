const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';

export async function GET() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return Response.json({ online: false, error: `HTTP ${res.status}` });
    }

    const stats = await res.json();
    const gpu = stats.devices?.[0];

    return Response.json({
      online: true,
      vram: gpu ? {
        total: gpu.vram_total,
        free: gpu.vram_free,
        used: gpu.vram_total - gpu.vram_free,
        name: gpu.name,
      } : null,
      queueRemaining: stats.exec_info?.queue_remaining ?? 0,
    });
  } catch {
    return Response.json({ online: false, error: 'ComfyUI not reachable' });
  }
}
