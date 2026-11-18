'use client';
import {useEffect,useState} from 'react';
import {LoaderCircle,ArrowRight} from 'lucide-react';
import Logbook from './logbook';
import {zones,isZone,ZONE_STORAGE_KEY,type ZoneId} from '@/lib/zones';
export default function ZoneGate(){
 const [zone,setZone]=useState<ZoneId|null>(null);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem(ZONE_STORAGE_KEY);if(isZone(saved))setZone(saved);}catch{setStorageError('This browser cannot remember your zone. You can still open it for this visit.');}setReady(true);},[]);
 function choose(id:ZoneId){try{localStorage.setItem(ZONE_STORAGE_KEY,id);setStorageError('');}catch{setStorageError('This browser cannot remember your zone. You can still use it for this visit.');}setZone(id);}
 if(!ready)return <div className="account-loading"><LoaderCircle className="spin"/><p>Opening your logbook…</p></div>;
 if(zone)return <Logbook key={zone} zone={zone} onChangeZone={()=>setZone(null)}/>;
 return <main className="account-page"><section className="account-intro"><img className="account-logo" src="/artwork/academy-logo.png" alt="Umm Abbad Academy"/><p className="eyebrow">THE RIPPLE EFFECT · LIVING OUR ILM</p><h1>The 100 Acts<br/><em>of Good</em></h1><p className="account-subtitle">Team Log</p><img className="account-garland" src="/artwork/gold-garland.png" alt=""/><p className="arabic" lang="ar" dir="rtl">أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ</p><blockquote>“The most beloved deeds to Allah are those done consistently, even if they are small.”</blockquote><p className="eyebrow">SAHIH AL-BUKHARI 6464 · SAHIH MUSLIM 783</p></section><section className="account-card"><p className="eyebrow">EVERY ACT IS A DROP</p><h2>Choose your zone</h2><p>Your browser will remember your choice and open the same zone next time.</p><div className="zone-options">{zones.map(z=><button className="btn btn-light zone-option" key={z.id} onClick={()=>choose(z.id)}><span>{z.label}</span><ArrowRight size={20}/></button>)}</div>{storageError&&<p className="form-error" role="status">{storageError}</p>}<p className="account-note">No account or password is needed. Everyone choosing the same zone shares its logbook.</p><a className="text-btn" href="/team-log.pdf" target="_blank" rel="noreferrer">Read the original Team Log</a></section></main>;
}
