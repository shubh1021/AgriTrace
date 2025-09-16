
import { NextRequest, NextResponse } from 'next/server';

// This is the API route that will be called from your client-side components.
// It securely calls the ElevenLabs API on the server.
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === "YOUR_ELEVENLABS_API_KEY") {
      return NextResponse.json({ error: 'ElevenLabs API key is not configured.' }, { status: 500 });
    }
    
    // You can find your Voice ID in the Voice Lab on the ElevenLabs website.
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Example Voice ID for "Rachel"

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const headers = new Headers();
    headers.append('Accept', 'audio/mpeg');
    headers.append('xi-api-key', apiKey);
    headers.append('Content-Type', 'application/json');

    const body = JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1', // Or any other model you prefer
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API Error:', errorText);
        return NextResponse.json({ error: `Failed to generate audio: ${errorText}` }, { status: response.status });
    }

    // Stream the audio response directly back to the client.
    if (response.body) {
        return new NextResponse(response.body, {
            status: 200,
            headers: { 'Content-Type': 'audio/mpeg' },
        });
    }

    return NextResponse.json({ error: 'No audio stream in response.' }, { status: 500 });

  } catch (error) {
    console.error('Error in text-to-speech route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
