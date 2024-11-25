import Image from "next/image";
import { useRef } from "react";
import type { ChangeEvent, MouseEvent } from "react";

import { useCart } from "../context/cartContext";
import type { CartItem } from "../context/cartContext";
import { useCatalog } from "../context/catalogContext";
import { useLanguage } from "../context/languageContext";

export function CartItemComponent({ item }: { item: CartItem }) {
  const optionSelectRef = useRef<HTMLSelectElement>(null);
  const catalog = useCatalog();
  const cart = useCart();
  const { t } = useLanguage();
  
  const catalogItem = catalog.find((catalogItem) => catalogItem.id === item.catalogid)!;
  
  const addOption = (e: ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    
    const optionId = parseInt(e.target.value);
    const catalogOption = catalogItem.options.find((option) => option.id === optionId)!;
    
    console.log(catalogOption);
    
    const option = {...catalogOption, quantity: 1};
    cart.addOptionToItem(item, option);

    optionSelectRef.current!.value = '';
    
    console.log(cart.item);
  };

  const removeOption = (e: MouseEvent<HTMLButtonElement>, optionId: number) => {
    e.preventDefault();

    const option = item.options.find((option) => option.id === optionId)!;

    cart.removeOptionFromItem(item, option);
  };

  const decrease = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (item.quantity > 1)
      cart.changeItemQuantity(item, --item.quantity);
  }

  const increase = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    cart.changeItemQuantity(item, ++item.quantity);
  }

  return (
    <li key={item.id} className='border-b border-gray-400 pb-2 pt-2'>
      <div className='flex'>
        <div>
          <Image src={catalogItem.imageUri} alt={item.name} width='100' height='100' className='aspect-square p-2' />
        </div>
        <div className='w-full'>
          <span className='flex justify-between text-2xl mr-10 w-3/4'>
            <span>{item.name}</span>
            <div className="flex justify-between w-1/4">
              <button onClick={decrease}
                      className='border border-gray-500 aspect-square h-8 rounded-full'> - </button>
              {item.quantity}
              <button onClick={increase}
                      className='border border-gray-500 aspect-square h-8 rounded-full'> + </button>
            </div>
            <span className='w-20 text-right'>${item.price * item.quantity}</span>
          </span>
          <ul>
            {item.options.map((option) => (
              <li key={option.id} className='flex items-center w-full pt-2 pb-2'>
                + {option.name} - ${option.price}
                <hr className='grow border border-gray-500 m-4'/>
                <button onClick={(e) => removeOption(e, option.id)}
                        className='light-remove-button rounded-full pl-3 pr-3 pt-1 pb-1'>
                  {t('cart.remove_option')}
                </button>
              </li>
            ))}
          </ul>
          <select ref={optionSelectRef} className='bg-transparent' defaultValue='' onChange={(e) => addOption(e)}>
            <option value='' disabled>{t('item.select_addon')}</option>
            {[...new Map(
              catalog
                .find((menu) => menu.id === item.catalogid)?.options
                ?.map((option) => [option.category, option]) // Deduplicate by category
            ).values()]
            .map((optionGroup) => (
              <optgroup key={optionGroup.category} label={optionGroup.category}>
                {catalog.find((menu) => menu.id === item.catalogid)?.options
                  .filter((option) => option.category === optionGroup.category)
                  .map((options) => (
                    <option key={options.id} value={options.id}>{options.name} - ${options.price}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-2xl pl-3'>{t('item.subtotal')}: ${item.subtotal ?? 0}</span>
        <button onClick={() => cart.removeItemFromCart(item)}
                className='remove-button rounded-full pl-5 pr-5 pt-2 pb-2'>{t('cart.remove')}</button>
      </div>
    </li>
  );
}