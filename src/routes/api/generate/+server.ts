import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const AI_BASE_URL = env.AI_BASE_URL;
const AI_API_KEY = env.AI_API_KEY;

export const POST: RequestHandler = async ({ request }) => {
  if (!AI_BASE_URL || !AI_API_KEY) {
    return json({ error: 'AI_BASE_URL or AI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const form = await request.formData();

    const prompt = (form.get('prompt') as string) ?? '';
    const style = (form.get('style') as string) ?? '';
    const aspect = (form.get('aspect') as string) ?? '';
    const quality = (form.get('quality') as string) ?? '';
    const model = process.env.AI_MODEL ?? 'google/gemini-2.5-flash-image';

    const combinedPromptParts: string[] = [];
    if (prompt) combinedPromptParts.push(prompt);
    if (style) combinedPromptParts.push(`Style: ${style}`);
    if (quality) combinedPromptParts.push(`Quality: ${quality}`);
    const combinedPrompt = combinedPromptParts.join('\n\n');

    const payload = {
      model,
      messages: [
        {
          role: 'user',
          content: combinedPrompt || 'Generate an image.'
        }
      ],
      modalities: ['image', 'text'],
      image_config: {
        aspect_ratio: aspect || '16:9'
      }
    };

    const endpoint = AI_BASE_URL.endsWith('/chat/completions')
      ? AI_BASE_URL
      : `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`;

    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      const text = await upstreamRes.text();
      console.error('generate handler unexpected non-json response:', text);
      return json({ error: 'Upstream returned non-JSON', raw: text }, { status: 502 });
    }

    const data = await upstreamRes.json();

    let imageUrl: string | null = null;
    try {
      const choices = data?.choices;
      if (Array.isArray(choices) && choices.length > 0) {
        const message = choices[0]?.message;
        const images = message?.images;
        if (Array.isArray(images) && images.length > 0) {
          imageUrl = images[0]?.image_url?.url ?? null;
        }
      }
    } catch (e) {
      console.log(e)
    }

    if (!imageUrl) {
      return json({ error: 'No image returned from AI backend', raw: data }, { status: 502 });
    }

    if (typeof imageUrl === 'string') {
      if (imageUrl.startsWith('data:')) {
        // already a data URL; nothing to do
      } else if (/^https?:\/\//i.test(imageUrl)) {
        // already an absolute URL; nothing to do
      } else {
        imageUrl = `data:image/png;base64,${imageUrl}`;
      }
    }

    return json({ imageUrl }, { status: upstreamRes.status });
  } catch (err) {
    console.error('generate handler error', err);
    return json({ error: 'Upstream request failed' }, { status: 502 });
  }
};
