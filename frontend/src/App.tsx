import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail } from 'lucide-react';
import { wedding } from './content';

type View = 'cover' | 'invitation' | 'details';
const photos = [1,2,3,4];

function Photo({n, className='' }:{n:number;className?:string}) {
  const [failed,setFailed]=useState(false);
  return <div className={`photo ${className}`}>{!failed&&<img src={`/images/booth-${n}.jpg`} alt={`Daisy and Ed, photo booth moment ${n}`} onError={()=>setFailed(true)}/>} {failed&&<span><small>YOUR PHOTO</small>{String(n).padStart(2,'0')}</span>}</div>;
}

function PhotoStrip(){return <div className="booth"><div className="booth-top"><span/><span/><span/></div><div className="booth-mouth"><div className="strip" aria-label="Four photo booth moments of Daisy and Ed">{photos.map(n=><Photo key={n} n={n}/>)}</div></div><div className="booth-lip"/></div>}

function Countdown(){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
  const parts=useMemo(()=>{let s=Math.max(0,Math.floor((new Date(wedding.dateISO).getTime()-now)/1000));const days=Math.floor(s/86400);s%=86400;return [[days,'Days'],[Math.floor(s/3600),'Hours'],[Math.floor(s%3600/60),'Minutes'],[s%60,'Seconds']] as const},[now]);
  return <div className="countdown" aria-label="Countdown to the wedding">{parts.map(([value,label],i)=><div key={label}><strong>{String(value).padStart(2,'0')}</strong><span>{label}</span>{i<parts.length-1&&<b>:</b>}</div>)}</div>
}

function InvitationArt(){return <div className="paper-scene" aria-label="A save-the-date card, postcard, flowers, and photographs"><div className="card main-card"><small>WE KINDLY INVITE YOU TO<br/>SAVE THE DATE</small><span className="script">Save the<br/>Date</span><em>{wedding.names}</em></div><div className="card note-card"><div className="postcard-copy"><small>THE CELEBRATIONS TO BE HELD ON</small><strong>{wedding.dateLong}</strong><span className="script">We'd love for you to join us<br/>at the wedding of<br/>{wedding.names}</span></div><span className="postcard-divider" aria-hidden="true"/><div className="postcard-address" aria-hidden="true"><span className="postcard-stamp">D & E</span><i/><i/><i/></div></div><div className="mini-strip">{photos.slice(0,3).map(n=><Photo key={n} n={n}/>)}</div><Photo n={4} className="polaroid"/><div className="flower" aria-hidden="true"><img src="/images/calla-lilies.png" alt=""/></div></div>}

function Cover({open}:{open:()=>void}){return <section className="cover view"><header><p className="caps">We are getting married!</p><h1>{wedding.names}</h1></header><PhotoStrip/><div className="cover-copy"><h2>Save the Date</h2><p className="date">{wedding.date}</p><button className="outline-button" onClick={open}>Open invitation <ArrowRight size={15}/></button></div></section>}

function Invitation({openDetails,goHome}:{openDetails:()=>void;goHome:()=>void}){const [heroFailed,setHeroFailed]=useState(false);return <div className="invitation view"><section className="invitation-main"><p className="caps">Meet us at</p><h2>{wedding.venue}</h2><p className="caps date-long">{wedding.dateLong}</p><InvitationArt/><p className="caps join-us">We hope you can join us in…</p><Countdown/><p className="caps note">Formal invitation to follow.<br/>Please click below to share your address!</p><button className="outline-button" onClick={openDetails}>Share your address</button></section><section className="couple-photo">{!heroFailed&&<img src="/images/couple-hero.jpg" alt="Daisy and Ed" onError={()=>setHeroFailed(true)}/>} {heroFailed&&<div className="hero-placeholder"><span>YOUR FAVORITE<br/>COUPLE PHOTO</span></div>}<div className="photo-overlay"><h2>{wedding.names}</h2><p className="caps">Questions?</p><p>For any questions, please contact us at:<br/><a href={`mailto:${wedding.email}`}>{wedding.email}</a></p><button className="outline-button" onClick={goHome}><ArrowLeft size={14}/> Go back</button></div></section></div>}

function Details({back}:{back:()=>void}){
 const [state,setState]=useState<'idle'|'saving'|'saved'>('idle'),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setState('saving');setError('');const data=Object.fromEntries(new FormData(e.currentTarget));try{const response=await fetch('/api/addresses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.detail||'We couldn’t save your address.');setState('saved');e.currentTarget.reset()}catch(e){setError(e instanceof Error?e.message:'Something went wrong.');setState('idle')}}
 return <section className="details view"><button className="back-button" onClick={back}><ArrowLeft size={14}/> Go back</button><h2>Details</h2>{state==='saved'?<div className="success" role="status"><Check size={34}/><h3>Thank you!</h3><p>We’ve saved your mailing details and can’t wait to celebrate with you.</p><button className="outline-button" onClick={back}>Return to invitation</button></div>:<><p className="caps details-intro">We’d love for you to be part of our celebration! Please share your mailing address so we can send the official invitation with all the details for our wedding day.</p><p className="caps">Please kindly reply by {wedding.replyBy}</p><form onSubmit={submit}><label>Your full name*<input name="name" autoComplete="name" required maxLength={120}/></label><label>Email address*<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Mailing address*<textarea name="address" autoComplete="street-address" required rows={4} maxLength={600}/></label><label>Any additional details?<textarea name="details" rows={3} maxLength={1200}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="submit-button" disabled={state==='saving'}>{state==='saving'?'Saving…':'Submit'}</button></form></>}<div className="seal"><span>D</span><small>&</small><span>E</span></div></section>
}

export default function App(){const [view,setView]=useState<View>('cover');useEffect(()=>{window.scrollTo(0,0)},[view]);return <main className={`app view-${view}`}>{view==='cover'&&<Cover open={()=>setView('invitation')}/>} {view==='invitation'&&<Invitation openDetails={()=>setView('details')} goHome={()=>setView('cover')}/>} {view==='details'&&<Details back={()=>setView('invitation')}/>}<footer><Mail size={13}/><span>Daisy & Ed · 2027</span></footer></main>}
