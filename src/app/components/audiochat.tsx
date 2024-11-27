'use client'
import React, { useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools';
import { RealtimeClient } from '@openai/realtime-api-beta';
import type { ItemType } from '@openai/realtime-api-beta/dist/lib/client';
import type { ItemContentDeltaType } from '@openai/realtime-api-beta/dist/lib/conversation';

import { useCart } from '../context/cartContext';
import type { CartItemOption } from '../context/cartContext';
import { useCatalog } from '../context/catalogContext';
import { useLanguage } from '../context/languageContext';
import { useRouter } from 'next/navigation';

type RealtimeEvent = {
  time: `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;
  source: 'server' | 'client';
  event: {
    event_id: string;
    response: {
      id: string;
      object: string;
      output: [];
      status: string;
      status_details: {
        error?: {
          code: string;
          message: string;
          type: string
        }
      };
      usage: {
        total_tokens: number;
        input_tokens: number;
        output_tokens: number;
      };
      type: string
    }
  }
};

type UpdatedItemOption = CartItemOption & { status?: string };

type UpdatedItems = {
  id?: string;
  name?: string;
  catalogid?: number;
  price?: number;
  quantity?: number;
  options?: UpdatedItemOption[];
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
  const catalog = useCatalog();
  const cart = useCart();
  const { setLanguage } = useLanguage();
  const router = useRouter();

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    if (!client || !wavRecorder || !wavStreamPlayer) {
      console.error("Initialization error: Refs not set");
      return;
    }

    startTimeRef.current = new Date().toISOString();

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

  useEffect(() => {
    const client = clientRef.current;

    client.updateSession({
      instructions:
        '당신은 주문을 받는 점원입니다. ' +
        '사용자가 메뉴 설명을 원할 때는 옵션을 제외하고 설명하고, 사용자가 옵션 설명을 원할 때 옵션 설명을 하세요. ' +
        '최신 상태를 위해 대답하기 전 툴을 사용하여 정보를 얻으세요. ' +
        'KRW, USD 등의 단위는 원, 달러 등으로 읽으세요. ' +
        '아이스 아메리카노 처럼 주문할 경우, 아메리카노 + 차갑게 옵션을 적용하세요.'
      ,
      turn_detection: {
        type: 'server_vad',
        threshold: 0.7,
      },
    });
  }, []);

  // Realtime API 클라이언트 설정
  useEffect(() => {
    const client = clientRef.current;

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
        console.log("Function Calling: view_menu");
        let result = "";

        catalog.forEach((menu) => {
          result += `${menu.name}, ${menu.price}KRW\n`;
        });

        console.log(result);

        return result;
      }
    );

    // 옵션 확인 툴
    client.addTool(
      {
        name: 'view_options',
        description: 'View available menu options and price.',
        parameters: {
          type: 'object',
          properties: {
            name: {type: 'string'},
          },
          required: ['name'],
        }
      },
      async ({ name }: { name: string }) => {
        console.log("Function Calling: view_options");
        
        const options = catalog.find((menu) => menu.name === name)?.options;
        
        if (!options) return "Menu not found";

        let result = "";

        options.forEach((option) => {
          result += `${option.name}, ${option.price}KRW\n`;
        });

        console.log("Result:", result);

        return result;
      }
    )
    
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
        console.log("Function Calling: view_cart");

        let result = "";

        cart.item.forEach((item) => {
          result += `[${item.id}] ${item.quantity}x ${item.name} = ${item.price}KRW\n`;
          item.options.forEach((option) => {
            result += `+ ${option.quantity}x ${option.name} = ${option.price * option.quantity}KRW\n`
          });
          result += '\n';
        });

        console.log("Result:", result);

        return result;
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
                  options: {
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
                required: ['name', 'quantity'],
              },
            },
          },
          required: ['items'],
        },
      },
      async ({ items }: { items: { name: string; quantity: number; options?: CartItemOption[] }[] }) => {
        console.log("Function Calling: add_item");
        console.log(catalog);

        const addedItems: UpdatedItems[] = [];

        items.forEach((item) => {
          console.log(`Adding ${item.quantity} of ${item.name} to the cart`);
          const menu = catalog.find(menu => menu.name === item.name);
          
          if (!menu) {
            console.error(`Menu item ${item.name} not found.`);
            addedItems.push({...item, status: "menu not found"});
            return; // Skip this item
          }

          const options: UpdatedItemOption[] = [];
          item.options?.forEach((cartOption) => {
            const option: UpdatedItemOption = cartOption;

            if (!menu.options.map((catalogOption) => catalogOption.name).includes(option.name)) {
              option.status = `option not found on menu ${menu.name}`;
            } else {
              option.status = 'success';
            }

            options.push(option);
          });
          console.log(options);

          try {
            const cartItemId = uuidv4();
            cart.addItemToCart({...menu, id: cartItemId, name: item.name, catalogid: menu.id, quantity: item.quantity, options: options});
            addedItems.push({...menu, id: cartItemId, catalogid: menu.id, quantity: item.quantity, options, status: "success"});
          } catch (error) {
            console.error(`Failed to add ${item.name} to the cart:`, error);
            addedItems.push({...menu, id: '', name: item.name, quantity: item.quantity, options, status: "unknown error"});
          }
        });

        let result = "";

        addedItems.forEach((item) => {
          result += `${item.quantity}x ${item.name}: ${item.status}\n`;
          item.options?.forEach((option) => {
            result += `+ ${option.quantity}x ${option.name}: ${option.status}\n`
          });
        });

        console.log("Result:", result);

        return result;
      }
    );

    // 옵션 추가 툴
    client.addTool(
      {
        name: 'add_option',
        description: "Add options to an existing item in the user's cart",
        parameters: {
          type: 'object',
          properties: {
            itemId: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                },
                required: ['name', 'quantity'],
              },
            },
          },
          required: ['itemId', 'options'],
        },
      },
      async ({
        itemId,
        options,
      }: {
        itemId: string;
        options: { name: string; quantity: number }[];
      }) => {
        console.log("Function Calling: add_option")
        const cartItem = cart.item.find((item) => item.id === itemId);

        if (!cartItem) {
          console.error(`Cart item with ID ${itemId} not found.`);
          return `Cart item with ID ${itemId} not found.`;
        }

        const updatedOptions: UpdatedItemOption[] = [];
        for (const option of options) {
          const catalogOption = catalog.find((menu) =>
            menu.id === cartItem.catalogid
          )?.options?.find((opt) => opt.name === option.name);

          if (!catalogOption) {
            console.error(`Option ${option.name} not found in catalog.`);
            updatedOptions.push({id: -1, name: option.name, price: 0, quantity:0, category: '', status: `option ${option.name} not found`})
            continue; // Skip invalid options
          }

          console.log(`Add option ${option.name} to ${cartItem.name}`);

          updatedOptions.push({ ...catalogOption, quantity: option.quantity, status: 'success' });

          cart.addOptionToItem(cartItem, {...catalogOption, quantity: 1});
        }

        let result = '';

        for (const option of updatedOptions) {
          result += `${option.quantity}x ${option.name}: ${option.status}\n`
        }

        return result;
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
            changedItems.push({id: id, 'status': 'item not found'});
            continue;
          }

          console.log(`Changing ${item.name} quantity to ${quantity}`);

          try {
            cart.changeItemQuantity(item, quantity);
            changedItems.push({...item, quantity: quantity, status: "success"});
          } catch (error) {
            console.error(`Failed to add ${cart.item[item.catalogid]} to the cart:`, error);
            changedItems.push({...item, quantity: quantity, status: "unknown error"});
          }
        }

        let result = '';
        for (const item of changedItems) {
          result += `Change ${item.id} ${item.name} quantity to ${item.quantity}: ${item.status}\n`;
        }

        return result;
      }
    );
    
    //언어 변경 툴
    client.addTool(
      {
        name: 'change_language',
        description: 'Change UI Language',
        parameters: {
          type: 'object',
          properties: {
            lang: {
              type: 'string',
              enum: ['en', 'ko'],
              description: 'Language code'
            }
          },
          required: ['language']
        }
      },
      async ({ lang }: { lang: string }) =>  {
        setLanguage(lang);
      }
    );

    client.addTool(
      {
        name: 'select_payment',
        description: 'Select payment',
        parameters: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['card', 'cash'],
              description: 'Payment method'
            }
          },
          required: ['method']
        }
      },
      async ({ method }: { method: string }) => {
        if (method === 'card') {
          router.replace('/checkout?method=card');
        } else if (method === 'cash') {
          router.replace('/checkout?method=cash');
        }
      }
    )
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    
    client.on('realtime.event', (event: RealtimeEvent) => {
      const error = event.event.response.status_details.error;
      if (error) {
        switch (error.code) {
          case 'rate_limit_exceeded':
            console.error("Rate Limit Exceeded!!");
            break;
        }
      }
    });
    client.on('error', (event: object) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: { item: ItemType, delta: ItemContentDeltaType }) => {
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }

      if ('status' in item && item.status === 'completed' && item.formatted.audio?.length) {
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
      <button onClick={connectConversation} disabled={clientRef.current.isConnected()}>
        {clientRef.current.isConnected() ? 'Connected' : 'Connect to Audio Chat'}
      </button>
    </div>
  );
};

export default AudioChat;