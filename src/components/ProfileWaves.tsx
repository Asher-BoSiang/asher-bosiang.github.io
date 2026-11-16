import { useEffect, useRef } from 'react';

export default function ProfileWaves({active}: {active: boolean}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;

    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    type Ripple = {x: number; y: number; start: number};
    let ripples: Ripple[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;

    function draw(now: number) {
      frame = 0;
      if (!ctx || !width || !height) return;
      ripples = ripples.filter(r => now - r.start < 1600);
      ctx.clearRect(0, 0, width, height);
      const ink = ctx.createLinearGradient(0, 0, width, 0);
      ink.addColorStop(0, 'rgba(102,122,105,0)');
      ink.addColorStop(.27, 'rgba(102,122,105,.32)');
      ink.addColorStop(.7, 'rgba(102,122,105,.60)');
      ink.addColorStop(1, 'rgba(102,122,105,.10)');
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      const rows = 30;
      for (let row = 0; row < rows; row++) {
        const v = row / (rows - 1);
        ctx.globalAlpha = .15 + .85 * Math.sin(v*Math.PI);
        ctx.beginPath();
        for (let x = 0; x <= width + 4; x += 4) {
          const u = x/width;
          const bend = .088*Math.sin(2*Math.PI*u + 1.45*v);
          const y = height*(.35 + .61*v - .31*u + bend);
          let offset = 0;
          for (const ripple of ripples) {
            const age = (now-ripple.start)/1000;
            const radius = Math.hypot(x-ripple.x, y-ripple.y);
            const crest = (radius-age*155)/48;
            offset += 5*Math.exp(-crest*crest)*(1-age/1.6)**2*Math.cos(crest*2.2);
          }
          const displacedY = y + 7*Math.tanh(offset/7);
          if (x === 0) ctx.moveTo(x,displacedY);
          else ctx.lineTo(x,displacedY);
        }
        ctx.stroke();
      }
      if (ripples.length) frame = requestAnimationFrame(draw);
    }
    function resize() {
      if (!canvas || !ctx) return;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const scale = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width*scale);
      canvas.height = Math.round(height*scale);
      ctx.setTransform(scale,0,0,scale,0,0);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function excite(event: PointerEvent) {
      if (!canvas || preference.matches) return;
      const now = performance.now();
      if (ripples.length && now - ripples[ripples.length-1].start < 180) return;
      const bounds = canvas.getBoundingClientRect();
      ripples.push({x:event.clientX-bounds.left,y:event.clientY-bounds.top,start:now});
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function motionChanged() { ripples = []; if (!frame) frame = requestAnimationFrame(draw); }
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
