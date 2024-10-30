'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools';

type RealtimeEvent = {
  content: string;
};

const AudioChat: React.FC = () => {
  // Configure the refs with the options you specified
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );

  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );

  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowAPIKeyInBrowser: true,
    })
  );

  const startTimeRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    if (!client || !wavRecorder || !wavStreamPlayer) {
      console.error("Initialization error: Refs not set");
      return;
    }

    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);

    // Start capturing audio from the microphone
    await wavRecorder.begin();

    // Connect the audio player for playback
    await wavStreamPlayer.connect();

    // Connect to the Realtime API via the relay
    await client.connect();

    // Optional: Initial greeting message or prompt
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`,
      },
    ]);

    // Send audio data directly to server with server-side voice activity detection
    await wavRecorder.record((data) => {
      client.appendInputAudio(data.mono);
    });
  }, []);

  // 툴 설정
  useEffect(() => {
    const client = clientRef.current;

    // 메뉴 확인 툴
    client.addTool(
      {
        name: 'view_menu',
        description: 'View available menu items and price.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      async () => {}
    );
    
    // 장바구니 확인 툴
    client.addTool(
      {
        name: 'view_cart',
        description: "View user's cart items.",
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      async () => {}
    );

    // 메뉴 추가 툴
    client.addTool(
      {
        name: 'add_item',
        description: "Add items to user's cart",
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {type: 'string'},
                  quantity: {type: 'number'},
                },
                required: ['name', 'quantity'],
              },
            },
          },
          required: ['items'],
        },
      },
      async ({ items }: { items: { name: string; quantity: number }[] }) => {
        // Example logic: Add items to cart
        items.forEach(item => {
          console.log(`Adding ${item.quantity} of ${item.name} to the cart`);
          // Here you would handle cart logic, e.g., update cart state or send data to a backend.
        });

        // Return confirmation or updated cart state if needed
        return { status: 'success', addedItems: items };
      }
    );

  }, []);

  return (
    <div>
      <button onClick={connectConversation} disabled={isConnected}>
        {isConnected ? 'Connected' : 'Connect to Audio Chat'}
      </button>
      <div>
        {realtimeEvents.map((event, idx) => (
          <p key={idx}>{event.content}</p>
        ))}
      </div>
    </div>
  );
};

export default AudioChat;