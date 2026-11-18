'use client';

import {useId,useRef,useState} from 'react';
import {ArrowUpRight,Search} from 'lucide-react';

export default function SunnahSearch({context='hadith'}:{context?:'collection'|'hadith'|'act'}){
  const id=useId();
  const link=useRef<HTMLAnchorElement>(null);
  const [query,setQuery]=useState('');
  const term=query.trim();
  const href=term?`https://sunnah.com/search?q=${encodeURIComponent(term)}`:'https://sunnah.com/';

  return <section className="sunnah-search" aria-labelledby={`${id}-heading`}>
    <h3 id={`${id}-heading`}><Search size={17}/>Find a hadith on Sunnah.com</h3>
    <label htmlFor={id}>Topic or hadith reference</label>
    <div className="sunnah-search-row">
      <input id={id} type="search" value={query} maxLength={200} placeholder="Search Sunnah.com…" onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();link.current?.click();}}}/>
      <a ref={link} className="btn btn-light" href={href} target="_blank" rel="noopener noreferrer" aria-label="Search Sunnah.com (opens in a new tab)">Search Sunnah.com<ArrowUpRight size={15}/></a>
    </div>
    <p>Opens in a new tab. Use <strong>Copy</strong> on Sunnah.com, then {context==='collection'?<>choose <strong>Add a hadith</strong> here and paste its Arabic, translation, and reference.</>:context==='act'?<>paste the hadith text and reference into the fields below.</>:<>paste the Arabic, translation, and reference into the fields below.</>}</p>
  </section>;
}
