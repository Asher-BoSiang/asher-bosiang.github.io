import { useEffect, useRef } from 'react';

type Point = {x: number; y: number};
type Sample = Point & {elevation: number};

// Intersect a smooth height field with evenly spaced elevation planes.
function terrainContours(width: number, height: number) {
  const levels: Point[][] = Array.from({length: 38}, () => []);
  const step = 8;
  function sample(x: number, y: number): Sample {
    const u = x/width, v = y/height;
    const ridge = u + .12*Math.sin(4.8*v + .6) + .047*Math.sin(8*u - 4*v);
    const valley = v + .11*Math.sin(5.3*u) + .05*Math.cos(6*u + 3*v);
    const elevation = .49*Math.cos(6.3*ridge - 2.6*valley)
      + .32*Math.sin(5.8*valley + 1.7*ridge)
      + .18*Math.cos(7.7*ridge + 5*valley);
    return {x,y,elevation};
  }
  function slice(a: Sample,b: Sample,c: Sample) {
    const points = [a,b,c];
    const low = Math.ceil((Math.min(a.elevation,b.elevation,c.elevation)+1)*18);
    const high = Math.floor((Math.max(a.elevation,b.elevation,c.elevation)+1)*18);
    for(let level=low;level<=high;level++){
      const h = level/18-1;
      for(let edge=0;edge<3;edge++){
        const start=points[edge], end=points[(edge+1)%3];
        if ((start.elevation<h) === (end.elevation<h)) continue;
        const t=(h-start.elevation)/(end.elevation-start.elevation);
        levels[level].push({x:start.x+t*(end.x-start.x),y:start.y+t*(end.y-start.y)});
      }
    }
  }
  const columns = Math.ceil(width/step)+1;
  const row = (y:number) => Array.from({length:columns},(_,i)=>sample(i*step,y));
  let upper = row(0);
  for(let y=step;y<height+step;y+=step){
    const lower=row(y);
    for(let i=1;i<columns;i++){
      slice(upper[i-1],upper[i],lower[i]);
      slice(upper[i-1],lower[i],lower[i-1]);
    }
    upper=lower;
  }
  return levels;
}

export default function ProfileWaves({active}: {active: boolean}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;

    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    type Ripple = {x: number; y: number; start: number};
    let ripples: Ripple[] = [];
    let contact: Ripple | undefined;
    let frame = 0;
    let width = 0;
    let height = 0;
    let contours: Point[][] = [];

    function draw(now: number) {
      frame = 0;
      if (!ctx || !width || !height) return;
      ripples = ripples.filter(r => now - r.start < 1050);
      const contactAge = contact ? (now-contact.start)/420 : 1;
      const contactLift = 18 * Math.max(0, 1-contactAge)**2;
      ctx.clearRect(0, 0, width, height);
      const ink = ctx.createLinearGradient(0, 0, width, 0);
      ink.addColorStop(0, 'rgba(102,122,105,0)');
      ink.addColorStop(.18, 'rgba(102,122,105,.37)');
      ink.addColorStop(.72, 'rgba(102,122,105,.62)');
      ink.addColorStop(1, 'rgba(102,122,105,.28)');
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      contours.forEach((segments, level) => {
        const indexContour = level % 5 === 0;
        ctx.lineWidth = indexContour ? 1.15 : .8;
        ctx.globalAlpha = indexContour ? .91 : .67;
        ctx.beginPath();
        for (let i=0;i<segments.length;i++) {
          const {x,y} = segments[i];
          let offset = 0;
          for (const ripple of ripples) {
            const age = (now-ripple.start)/1000;
            const radius = Math.hypot(x-ripple.x, y-ripple.y);
            const crest = (radius-age*145)/42;
            offset += 2.55*Math.exp(-crest*crest)*(1-age/1.05)**3;
          }
          const proximity = contact && contactLift ? Math.exp(-((x-contact.x)**2 + (y-contact.y)**2)/3800) : 0;
          const displacedY = y - contactLift*proximity + 3*Math.tanh(offset/3);
          if (i % 2 === 0) ctx.moveTo(x,displacedY);
          else ctx.lineTo(x,displacedY);
        }
        ctx.stroke();
      });
      if (ripples.length || contactLift) frame = requestAnimationFrame(draw);
    }
    function resize() {
      if (!canvas || !ctx) return;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      contours = width && height ? terrainContours(width,height) : [];
      const scale = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width*scale);
      canvas.height = Math.round(height*scale);
      ctx.setTransform(scale,0,0,scale,0,0);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function excite(event: PointerEvent) {
      if (!canvas || preference.matches) return;
      const now = performance.now();
      const bounds = canvas.getBoundingClientRect();
      contact = {x:event.clientX-bounds.left,y:event.clientY-bounds.top,start:now};
      const last = ripples[ripples.length-1];
      if (!last || now-last.start > 170) ripples.push(contact);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function motionChanged() { contact = undefined; ripples = []; if (!frame) frame = requestAnimationFrame(draw); }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointerenter', excite);
    canvas.addEventListener('pointermove', excite);
    canvas.addEventListener('pointerdown', excite);
    preference.addEventListener('change',motionChanged);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerenter',excite);
      canvas.removeEventListener('pointermove',excite);
      canvas.removeEventListener('pointerdown',excite);
      preference.removeEventListener('change',motionChanged);
    };
  }, [active]);
  return active ? <canvas ref={ref} className="profile-waves" aria-hidden="true"/> : null;
}
