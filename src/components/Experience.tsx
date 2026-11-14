import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import TextPresence from './TextPresence';
import { profile } from '../data/profile';
import type { Phase, Project } from '../data/types';
import type { ArchiveInput } from './scene/motion';
const Scene = lazy(()=>import('./scene/Scene'));
const phaseLabels: Partial<Record<Phase,string>> = { Extracting:'Retrieving the case', Opening:'Opening the archive', DiscFloating:'Lifting the disc', PlayerEntering:'Preparing the player', TrayExtending:'Opening the tray', DiscLoading:'Loading the project', TrayRetracting:'Reading the disc', Returning:'Returning to the collection' };
export default function Experience({projects,base,children}:{projects:Project[];base:string;children:ReactNode}) {
  const [hydrated,setHydrated]=useState(false);
  const [phase,setPhase]=useState<Phase>('Profile');
  const [selected,setSelected]=useState(0);
  const [mounted,setMounted]=useState(false);
  const [ready,setReady]=useState(false);
  const [fallback,setFallback]=useState(false);
  const [reduced,setReduced]=useState(false);
  const [list,setList]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const details=useRef<HTMLDivElement>(null);
  const sceneWindow=useRef<HTMLDivElement>(null);
  const input=useRef<ArchiveInput>({x:0,y:0,drag:0,energy:0,invalidate:()=>{}});
  const lastWheel=useRef(0); const drag=useRef({x:0,y:0,active:false});
  const returning=useRef(false);
  const project=projects[selected];
  const collection=phase==='Collection';
  const busy=!['Profile','Collection','Details'].includes(phase);
  const onPhase=useCallback((p:Phase)=>{if(returning.current&&p!=='Collection')return;if(p==='Collection')returning.current=false;setPhase(p);},[]);
  const onReady=useCallback(()=>setReady(true),[]);
  const onFailure=useCallback(()=>{setFallback(true);setReady(false);setPhase(p=>p==='Profile'?'Profile':'Collection');},[]);
  useEffect(()=>{
    setHydrated(true);
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
    const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');
    if(!gl||new URLSearchParams(location.search).has('no3d'))setFallback(true);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ()=>media.removeEventListener('change',update);
  },[]);
  const explore=()=>{setMounted(true);setPhase('Collection');root.current?.scrollIntoView({behavior:reduced?'instant':'smooth'});};
  const navigate=useCallback((delta:number)=>{if(collection)setSelected(i=>(i+delta+projects.length)%projects.length);},[collection,projects.length]);
  const open=()=>{if(!collection)return;root.current?.scrollIntoView({behavior:'instant'});if(fallback||reduced)setPhase('Details');else if(ready)setPhase('Extracting');};
  const back=useCallback(()=>{if(phase==='Profile'||phase==='Collection')return;details.current?.scrollTo(0,0);root.current?.scrollIntoView({behavior:'instant'});if(fallback||reduced){setPhase('Collection');return;} returning.current=true;setPhase('Returning');},[phase,fallback,reduced]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      const el=event.target as HTMLElement;
      if(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||event.altKey||event.metaKey||event.ctrlKey)return;
      if(event.key==='ArrowRight'&&collection){event.preventDefault();navigate(1);}
      if(event.key==='ArrowLeft'&&collection){event.preventDefault();navigate(-1);}
      if(event.key==='Escape'&&phase!=='Profile'&&phase!=='Collection'){event.preventDefault();back();}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[navigate,collection,phase,back]);
  useEffect(()=>{
    if(phase==='Details') {
      details.current?.querySelector<HTMLElement>('article[data-slug="'+project.slug+'"]')?.focus({preventScroll:true});
      root.current?.scrollIntoView({behavior:'instant'});
    }
  },[phase,project.slug]);
  useEffect(()=>{
    const el=sceneWindow.current;if(!el)return;
    const wheel=(e:WheelEvent)=>{
      if(!collection||list)return;e.preventDefault();
      const now=Date.now();if(now-lastWheel.current>450&&Math.abs(e.deltaX+e.deltaY)>12){lastWheel.current=now;input.current.energy=.8;input.current.invalidate();navigate(e.deltaX+e.deltaY>0?1:-1);}
    };
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[collection,list,navigate]);
  return <div ref={root} className={`experience ${phase==='Profile'?'is-profile':'is-collection'} ${phase==='Details'?'is-details':''} ${reduced?'reduced-motion':''}`} data-phase={phase} data-project={project.slug} style={{'--accent':project.themeColor} as CSSProperties}>
    <header className="site-header">
      <a className="wordmark" href={base} aria-label="Asher Wang home">AW<span>ASHER WANG<br/>ENGINEERING PORTFOLIO</span></a>
      <nav aria-label="Main navigation"><button onClick={()=>{if(!busy){setPhase('Profile');}}} disabled={!hydrated||busy} aria-current={phase==='Profile'?'page':undefined}>01 / Profile</button><button onClick={()=>{if(phase==='Details')back();else if(!busy)explore();}} disabled={!hydrated||busy} aria-current={phase!=='Profile'?'page':undefined}>02 / Selected work <span className="nav-count">{projects.length.toString().padStart(2,'0')}</span></button><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a></nav>
    </header>
    <main id="main-content">
      <section className="profile-panel" aria-label="Personal profile" inert={phase!=='Profile'}>
        <div className="profile-topline"><p className="eyebrow"><span className="status-dot"/>Software meets the physical world</p><span className="micro">PORTFOLIO / VOL. 01</span></div>
        <div className="profile-grid">
          <div className="profile-copy"><p className="eyebrow">Hello, I'm</p><h1>Asher<br/><span>Wang.</span></h1><h2>{profile.headline}</h2><button className="explore" disabled={!hydrated} onClick={explore}>Explore Projects <span>→</span></button><p className="intro">{profile.introduction}</p><div className="education"><span className="small-cross">+</span><div><strong>{profile.degree}</strong><span>{profile.university}</span></div></div>
          <div className="contact-links"><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>{profile.linkedin?<a href={profile.linkedin}>LinkedIn ↗</a>:<span title="LinkedIn URL has not been provided">LinkedIn <small>to add</small></span>}{profile.email?<a href={`mailto:${profile.email}`}>Email ↗</a>:<span>Email <small>to add</small></span>}{profile.resume?<a href={profile.resume}>Résumé ↓</a>:<span>Résumé <small>to add</small></span>}</div></div>
          <div className="profile-art" aria-label="Profile portrait placeholder">
            <div className="art-corner top">FIG. 01 / THE ENGINEER</div>
            {profile.photo?<img className="portrait" src={profile.photo} alt="Asher Wang"/>:<><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="portrait-monogram">aw<span>PORTRAIT TO BE ADDED</span></div><div className="orbit-point"/></>}
            <div className="art-corner bottom"><span>HARDWARE ↔ SOFTWARE</span><span>+ 01</span></div>
          </div>
        </div>
        <div className="profile-bottom"><div><p className="eyebrow">Technical toolkit</p><div className="skill-line">{profile.skills.map(s=><span key={s}>{s}</span>)}</div><p className="interests">Exploring / {profile.interests.join(' · ')}</p></div><div className="experience-note"><p className="eyebrow">Experience</p><strong>{profile.experience.company}</strong><p>{profile.experience.role}</p><small>Dates & full role details to be added</small></div></div>
        <div className="explore-bar"><span className="micro">A COLLECTION OF SYSTEMS & IDEAS</span><a className="micro" href="#project-index">Browse text index ↗</a></div>
      </section>
      <section className="collection-panel" aria-label="Project collection" inert={phase==='Profile'}>
        <div className="collection-top"><button className="text-button" disabled={busy} onClick={()=>{if(phase==='Details')back();else setPhase('Profile');}}>{phase==='Details'?'← Back to Collection':'↑ Back to Profile'}</button><span className="micro">THE ENGINEERING ARCHIVE / {projects.length.toString().padStart(2,'0')} RECORDS</span><button className="text-button" disabled={busy} onClick={()=>setList(v=>!v)}>{list?'Spatial view ◇':'Text index ≡'}</button></div>
        <div ref={sceneWindow} className="scene-window" aria-label="Interactive CD collection" onPointerDown={e=>{if(!collection)return;drag.current={x:e.clientX,y:e.clientY,active:true};}} onPointerMove={e=>{if(!collection)return;const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*2-1;const y=1-(e.clientY-rect.top)/rect.height*2;input.current.energy=Math.min(1,Math.abs(x-input.current.x)*5+.1);input.current.x=x;input.current.y=y;if(drag.current.active)input.current.drag=(e.clientX-drag.current.x)/rect.width*5;input.current.invalidate();}} onPointerLeave={()=>{input.current.x=0;input.current.y=0;input.current.drag=0;input.current.invalidate();}} onPointerUp={e=>{if(!drag.current.active)return;const dx=e.clientX-drag.current.x;const dy=e.clientY-drag.current.y;drag.current.active=false;input.current.drag=0;input.current.energy=.8;input.current.invalidate();if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))navigate(dx<0?1:-1);}} onPointerCancel={()=>{drag.current.active=false;input.current.drag=0;input.current.invalidate();}}>
          {mounted&&!fallback&&<Suspense fallback={<div className="loading">Preparing the collection…</div>}><Scene input={input} projects={projects} selected={selected} phase={phase} reduced={reduced} onPhase={onPhase} onSelect={setSelected} onReady={onReady} onFailure={onFailure}/></Suspense>}
          {fallback&&<div className="fallback-art"><div className="flat-case"><span className="eyebrow">AW / ENGINEERING ARCHIVE</span><strong>{String(selected+1).padStart(2,'0')}</strong><div className="flat-disc"/><span>{project.title}</span></div><p>3D is unavailable. All projects remain accessible.</p></div>}
        </div>
        <TextPresence show={collection&&!list} reduced={reduced}>
          <div className="collection-heading"><p className="eyebrow">Selected work</p><h2>A closer<br/>look.</h2><span className="micro">PICK A RECORD. EXPLORE A SYSTEM.</span></div>
          <TextPresence identity={project.slug} reduced={reduced}><aside className="project-overview" aria-live="polite"><p className="eyebrow"><span className="project-dot"/> RECORD {String(selected+1).padStart(2,'0')} / {String(projects.length).padStart(2,'0')}</p><p className="category">{project.category}</p><h3>{project.title}</h3><p className="overview-description">{project.shortDescription}</p><div className="tags">{project.technologies.map(t=><span key={t}>{t}</span>)}</div><button className="open-project" onClick={open} disabled={!ready&&!fallback&&!reduced}>{ready||fallback||reduced?'Open project':'Preparing 3D…'}<span>↗</span></button><a className="direct-link" href={`${base}projects/${project.slug}/`}>Read directly →</a></aside></TextPresence>
          <div className="collection-controls"><div className="record-count">{String(selected+1).padStart(2,'0')}<small> / {String(projects.length).padStart(2,'0')}</small></div><div className="browse-controls"><button onClick={()=>navigate(-1)} aria-label="Previous project">←</button><div className="record-dots">{projects.map((p,i)=><button key={p.slug} aria-label={`Select ${p.title}`} aria-pressed={selected===i} onClick={()=>setSelected(i)} style={{'--dot-color':p.themeColor} as CSSProperties}/>)}</div><button onClick={()=>navigate(1)} aria-label="Next project">→</button></div><span className="micro control-hint">DRAG / SCROLL / ← → TO BROWSE</span></div>
        </TextPresence>
        {collection&&list&&<div className="overlay-index"><p className="eyebrow">The collection</p><h2>Choose a project.</h2>{projects.map((p,i)=><a key={p.slug} className="index-row" href={`${base}projects/${p.slug}/`}><span>{String(i+1).padStart(2,'0')}</span><strong>{p.title}</strong><span>↗</span></a>)}</div>}
        {busy&&<div className="animation-status" role="status"><span className="status-dot"/>{phaseLabels[phase]}<button onClick={back} disabled={phase==='Returning'}>Cancel / Esc</button></div>}
        <TextPresence show={phase==='Details'} reduced={reduced}><div ref={details} className="details-panel"><div className="player-caption"><span className="eyebrow">NOW READING / RECORD {String(selected+1).padStart(2,'0')}</span><span className="micro">{project.title.toUpperCase()}</span></div>{children}<div className="detail-footer"><button className="primary-link" onClick={back}>← Back to Collection</button></div></div></TextPresence>
      </section>
    </main>
  </div>;
}
