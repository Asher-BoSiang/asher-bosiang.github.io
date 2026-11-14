import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Retain outgoing copy until its exit finishes, including rapid selection changes. */
export default function TextPresence({show=true,identity='',reduced=false,children}:{show?:boolean;identity?:string;reduced?:boolean;children:ReactNode}) {
  const [visible,setVisible]=useState(show);
  const [exiting,setExiting]=useState(false);
  const [displayed,setDisplayed]=useState(identity);
  const content=useRef(children);
  const latest=useRef(children);latest.current=children;
  if(displayed===identity&&show&&!exiting)content.current=children;
  useEffect(()=>{
    if(reduced){content.current=latest.current;setDisplayed(identity);setVisible(show);setExiting(false);return;}
    if(show&&displayed===identity&&visible)return;
    if(!visible&&show){content.current=latest.current;setDisplayed(identity);setVisible(true);setExiting(false);return;}
    if(!visible)return;
    setExiting(true);
    const timer=setTimeout(()=>{content.current=latest.current;setDisplayed(identity);setVisible(show);setExiting(false);},160);
    return()=>clearTimeout(timer);
  },[show,identity,displayed,visible,reduced]);
  return visible?<div className={`text-presence ${exiting?'text-exit':'text-enter'}`} aria-hidden={exiting||undefined}>{content.current}</div>:null;
}
