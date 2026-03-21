const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PEXELS_BASE = 'https://api.pexels.com';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  duration: number;
  image: string;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export async function GET(request: Request) {
  if (!PEXELS_API_KEY) {
    return Response.json({ error: 'PEXELS_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'photos'; // 'photos' or 'videos'
  const perPage = searchParams.get('per_page') || '5';
  const orientation = searchParams.get('orientation') || 'landscape';

  if (!query) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const endpoint = type === 'videos'
      ? `${PEXELS_BASE}/videos/search`
      : `${PEXELS_BASE}/v1/search`;

    const url = new URL(endpoint);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', perPage);
    url.searchParams.set('orientation', orientation);

    const res = await fetch(url.toString(), {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Pexels API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (type === 'videos') {
      const videos = (data.videos || []).map((v: PexelsVideo) => ({
        id: v.id,
        width: v.width,
        height: v.height,
        url: v.url,
        duration: v.duration,
        thumbnail: v.image,
        downloadUrl: v.video_files
          .filter((f) => f.quality === 'hd' || f.quality === 'sd')
          .sort((a, b) => b.width - a.width)[0]?.link || v.video_files[0]?.link,
      }));
      return Response.json({ type: 'videos', results: videos, total: data.total_results });
    }

    const photos = (data.photos || []).map((p: PexelsPhoto) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      url: p.url,
      photographer: p.photographer,
      src: p.src,
      alt: p.alt,
    }));
    return Response.json({ type: 'photos', results: photos, total: data.total_results });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
