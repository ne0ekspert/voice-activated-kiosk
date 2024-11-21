import type { ChangeEvent, ReactNode } from "react";
import { useLanguage } from "../context/languageContext";

export function PageTitle({ children }: { children: ReactNode }) {
  const language = useLanguage();

  function onLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();

    language.setLanguage(e.target.value);
  }

  return (
    <div className='flex w-full mb-5 mt-5'>
      <h1 className='text-3xl grow' style={{
        marginTop: '5px',
        marginBottom: '5px',
        marginLeft: '0px',
        fontSize: '40px',
        fontWeight: 'bold',
        backgroundColor: 'rgb(240, 193, 120)',
        padding: '5px 30px',
        textAlign: 'left',
        borderTop: '5px solid rgb(108, 88, 76)',
        borderBottom: '5px solid rgb(108, 88, 76)',
      }}>
        {children}
      </h1>
      <div style={{
        backgroundColor: 'rgb(240, 193, 120)',
        borderTop: '5px solid rgb(108, 88, 76)',
        borderBottom: '5px solid rgb(108, 88, 76)',
        padding: '5px10px',
        marginRight: '-13px',
        marginTop: '5px',
        marginBottom: '5px',
      }}>
        <select 
          onChange={onLanguageChange}
          style={{
            width: '100%',
            padding: '10px',
            border: 'none',
            backgroundColor: 'rgb(240, 193, 120)',
            fontSize: '21px',
            fontWeight: 'bold',
            color: 'rgb(108, 88, 76)',
          }}
        >
          <option value='en'>English</option>
          <option value='ko'>한국어</option>
        </select>
      </div>
    </div>
  );
}