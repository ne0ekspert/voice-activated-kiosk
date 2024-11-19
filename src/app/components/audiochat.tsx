'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools';
import { useCart } from '../context/cartContext';
import { useCatalog } from '../context/catalogContext';
import { v4 as uuidv4 } from 'uuid';

import type { CartItemOption } from '../context/cartContext';

type RealtimeEvent = {
  content: string;
};

type UpdatedItems = {
  id?: string;
  catalogid?: number;
  price?: number;
  quantity?: number;
  options?: CartItemOption[];
  status: string;
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
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowAPIKeyInBrowser: true,
    })
  );

  const startTimeRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const catalog = useCatalog();
  const cart = useCart();

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

    // Send audio data directly to server with server-side voice activity detection
    await wavRecorder.record((data) => {
      client.appendInputAudio(data.mono);
    });
  }, []);

  // Realtime API 클라이언트 설정
  useEffect(() => {
    const client = clientRef.current;

    client.updateSession({
      instructions: '당신은 주문을 받는 점원입니다.',
      turn_detection: { type: 'server_vad' },
    });

    const existingTools = Object.keys(client.tools) || [];
    console.log(existingTools);
    existingTools.map(tool => {
      client.removeTool(tool);
    });

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
      async () => {
        return catalog;
      }
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
      async () => {
        return cart.item;
      }
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
        console.log(catalog);

        const addedItems: UpdatedItems[] = [];

        for (const item of items) {
          console.log(`Adding ${item.quantity} of ${item.name} to the cart`);
          const menu = catalog.find(menu => menu.name === item.name);
          
          if (!menu) {
            console.error(`Menu item ${item.name} not found.`);
            addedItems.push({...item, status: "menu not found"});
            continue; // Skip this item
          }

          try {
            const cartItemId = uuidv4();
            cart.addItemToCart({...menu, id: cartItemId, catalogid: menu.id, quantity: item.quantity, options: []});
            addedItems.push({...menu, id: cartItemId, catalogid: menu.id, quantity: item.quantity, options: [], status: "success"});
          } catch (error) {
            console.error(`Failed to add ${item.name} to the cart:`, error);
            addedItems.push({...menu, id: '', quantity: item.quantity, options: [], status: "unknown error"})
          }
        }

        return { addedItems };
      }
    );

    // 수량 변경 툴
    client.addTool(
      {
        name: 'change_quantity',
        description: "Add items to user's cart",
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: "Item ID in the cart"
                  },
                  quantity: {
                    type: 'number',
                    description: "Item's new quantity"
                  },
                },
                required: ['id', 'quantity'],
              },
            },
          },
          required: ['items'],
        },
      },
      async ({ items }: { items: { id: string; quantity: number }[] }) => {
        const changedItems: UpdatedItems[] = [];

        for (const {id, quantity} of items) {
          const item = cart.item.find((cartItem) => cartItem.id === id);

          if (!item) {
            changedItems.push({'status': 'item not found'});
            continue;
          }
          console.log(`Adding ${quantity} of ${cart.item[item.catalogid]} to the cart`);

          try {
            cart.changeItemQuantity(item, quantity);
            changedItems.push({...item, quantity: quantity, status: "success"});
          } catch (error) {
            console.error(`Failed to add ${cart.item[item.catalogid]} to the cart:`, error);
            changedItems.push({...item, quantity: quantity, status: "unknown error"});
          }
        }

        return { changedItems };
      }
    );
    
  }, [cart, catalog]);

  useEffect(() => {
    const client = clientRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    
    // handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
    });
    client.on('error', (event) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      //const items = client.conversation.getItems();
      
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
    });
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