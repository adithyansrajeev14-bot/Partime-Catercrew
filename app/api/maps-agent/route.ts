import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, venue, location, userLocation } = await req.json();

    if (!query && !venue && !location) {
      return NextResponse.json({ error: 'Query or venue location is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const fullPrompt = `You are CaterCrew's dedicated Catering Venue & Route Logistics Assistant. 
The user needs real-time information about catering event places, routes, directions, transit, or nearby suppliers.

Context:
${venue ? `- Target Event Venue: ${venue}` : ''}
${location ? `- Target City / Area: ${location}` : ''}
${query ? `- User Question: ${query}` : ''}

Provide a structured, helpful, and concise response covering:
1. Exact Venue or Place details & landmarks
2. Best travel routes & transport options (Metro/Train, Bus, Auto/Cab, Driving) with approximate transit time
3. Parking & event entry tips for catering workers and delivery vans
4. Nearby useful catering amenities (e.g., ice vendors, ATMs, convenience stores, uniform shops) if relevant
5. Clear bullet points. Keep it practical for catering staff arriving on time for shifts.`;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Use gemini-3.8-flash with Google Maps Grounding
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fullPrompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: userLocation?.lat && userLocation?.lng ? {
              retrievalConfig: {
                latLng: {
                  latitude: Number(userLocation.lat),
                  longitude: Number(userLocation.lng),
                },
              },
            } : undefined,
          },
        });

        const rawText = response.text || '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // Extract maps places and URLs
        const places: Array<{ title: string; uri: string }> = [];
        for (const chunk of groundingChunks) {
          const mapsObj = (chunk as Record<string, unknown>).maps as { title?: string; uri?: string } | undefined;
          if (mapsObj?.uri) {
            places.push({
              title: mapsObj.title || 'View on Google Maps',
              uri: mapsObj.uri,
            });
          }
        }

        const destinationQuery = encodeURIComponent(venue ? `${venue}, ${location || ''}` : query || location || 'Mumbai');
        const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;

        return NextResponse.json({
          success: true,
          content: rawText,
          places,
          googleMapsDirectUrl,
          directionsUrl,
          destination: venue || query || location,
        });
      } catch (genAiError) {
        console.warn('Google Maps Grounding model call error, falling back to structured assistant:', genAiError);
      }
    }

    // Fallback response with Google Maps navigation links
    const target = venue || location || query || 'Event Venue';
    const destEncoded = encodeURIComponent(target);
    const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${destEncoded}`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destEncoded}`;

    const fallbackContent = `### 📍 Venue & Directions: ${target}

- **Venue Details:** Situated in ${location || 'the event district'}. Suitable for banquet setups, wedding lawns, and corporate catering.
- **Recommended Routes & Transit:**
  - **By Public Transit:** Check the nearest local railway/metro station or central bus terminus for fast shuttle/auto connections.
  - **By Road / Cab:** Accessible via major arterial roads. Allow 20-30 minutes extra buffer during peak evening wedding hours (6 PM - 8 PM).
- **Staff & Delivery Entry:** Usually situated at the service gate / back loading bay. Catering stewards should arrive 30-45 minutes prior to shift start for uniform check and briefing.
- **Navigation:** Use the real-time Google Maps links below to check live traffic, routes, and turn-by-turn directions.`;

    return NextResponse.json({
      success: true,
      content: fallbackContent,
      places: [
        { title: `${target} on Google Maps`, uri: googleMapsDirectUrl },
        { title: `Live Turn-by-Turn Directions to ${target}`, uri: directionsUrl },
      ],
      googleMapsDirectUrl,
      directionsUrl,
      destination: target,
    });
  } catch (error: unknown) {
    console.error('Maps Agent error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
