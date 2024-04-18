import type { RequestHandler } from '@sveltejs/kit';
import fetch from 'node-fetch';

export const GET: RequestHandler = async ({ params }) => {
  const { param } = params;

  const imageUrl = `https://circles-ubi.s3.amazonaws.com/uploads/avatars/${param}`;

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new Response('Image could not be fetched', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || imageBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    return new Response('Failed to fetch image', { status: 500 });
  }
};
