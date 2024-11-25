import type { MouseEvent, ChangeEvent, ReactNode } from "react";
import { useLanguage } from "../context/languageContext";
import AudioChat from "./audiochat";

export function PageTitle({ children }: { children: ReactNode }) {
  const language = useLanguage();

  function onLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();

    language.setLanguage(e.target.value);
  }

  function callManager(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    fetch('/api/call');
  }

  return (
    <div className='flex w-full mb-5 mt-5' style={{
      backgroundColor: 'rgb(240, 193, 120)',
      borderTop: '5px solid rgb(108, 88, 76)',
      borderBottom: '5px solid rgb(108, 88, 76)',
    }}>
      <h1 className='text-3xl grow mt-4 font-bold' style={{
        fontSize: '40px',
        padding: '5px 30px',
      }}>
        {children}
      </h1>
      <button className="flex items-center mr-8 text-xl font-bold" onClick={callManager}>
        {language.t('call_manager')}
      </button>
      <div className="mt-1 mb-1" 
        style={{
      }}>
        <AudioChat />
        <select onChange={onLanguageChange} className='w-full p-2.5 border-none text-xl font-bold'
          style={{
            backgroundColor: 'rgb(240, 193, 120)',
            color: 'rgb(108, 88, 76)',
          }}
          defaultValue={language.language}
        >
          <option value='en'>English</option>
          <option value='ko'>한국어</option>
        </select>
      </div>
    </div>
  );
}