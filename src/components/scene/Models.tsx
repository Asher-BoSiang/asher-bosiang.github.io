import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CASE_ANGLE, CASE_SPACING, decorativeColumns, entranceWave, waveOffset, type ArchiveMotion } from './motion';
import type { Project } from '../../data/types';

const SHELL_THICKNESS = .16;

export function Disc({ color }: { color: string }) {
  return <group>
    <mesh rotation={[0,0,0]}><ringGeometry args={[.115, 1.04, 96]} /><meshStandardMaterial color="#cdd3d2" metalness={.83} roughness={.24} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0,0,.006]}><ringGeometry args={[.22,.97,96]} /><meshPhysicalMaterial color="#e2e5e0" metalness={.5} roughness={.25} iridescence={.65} iridescenceIOR={1.3} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0,0,.012]}><ringGeometry args={[.13,.24,48]} /><meshStandardMaterial color={color} metalness={.5} roughness={.3} side={THREE.DoubleSide}/></mesh>
    {[.91,.93,.96,1.02].map(r => <mesh key={r} position={[0,0,.018]}><ringGeometry args={[r,r+.003,96]}/><meshBasicMaterial color="#a9b1ac" transparent opacity={.55} side={THREE.DoubleSide}/></mesh>)}
    <mesh position={[0,-.65,.02]}><planeGeometry args={[.42,.035]}/><meshBasicMaterial color={color} side={THREE.DoubleSide}/></mesh>
  </group>;
}
function Cover({ project }: { project: Project }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#efefe8'; c.fillRect(0,0,512,512);
    c.strokeStyle = '#d1d4c9'; c.lineWidth = 1;
    for (let i=0;i<7;i++) { c.beginPath(); c.arc(300,280,50+i*19,-.5,Math.PI*1.7); c.stroke(); }
    c.fillStyle = project.themeColor; c.fillRect(23,22,5,468);
    c.fillStyle = '#30362f'; c.font = '18px monospace'; c.fillText('AW / ENGINEERING ARCHIVE',45,54);
    c.font = 'bold 60px sans-serif'; c.fillText(String(project.displayOrder).padStart(2,'0'),43,137);
    c.font = 'bold 25px sans-serif';
    const words = project.title.split(' '); let line=''; let y=415;
    for (const word of words) { if ((line+' '+word).length>24) { c.fillText(line,45,y); line=word; y+=32; } else line += (line?' ':'')+word; }
    c.fillText(line,45,y); c.font='12px monospace'; c.fillText(project.technologies.slice(0,3).join(' / ').toUpperCase(),45,487);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace=THREE.SRGBColorSpace; return t;
  },[project]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[0,0,.02]}><planeGeometry args={[2.29,2.29]}/><meshStandardMaterial map={texture} roughness={.7} side={THREE.DoubleSide}/></mesh>;
}
function SpineLabel({project}: {project: Project}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = project.themeColor;
    ctx.fillRect(0,0,1024,80);
    ctx.fillStyle = '#f2f1e8';
    ctx.fillRect(46,9,912,62);
    ctx.fillStyle = '#343d37';
    ctx.font = 'bold 42px monospace';
    ctx.fillText(String(project.displayOrder).padStart(2,'0'),61,54);
    ctx.font = '32px sans-serif';
    ctx.fillText(project.title,153,51,690);
    for (let i=0;i<6;i++) ctx.fillRect(867+i*12,20,3+i%3,40);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [project]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[0,1.263,.065]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[2.46,.19]}/>
    <meshStandardMaterial map={texture} roughness={.48}/>
  </mesh>;
}
export function JewelCase({ project, lidRef, selected, withDisc = true }: { project: Project; lidRef?: React.Ref<THREE.Group>; selected: boolean; withDisc?: boolean }) {
  return <group>
    <mesh castShadow receiveShadow><boxGeometry args={[2.5,2.5,SHELL_THICKNESS]}/><meshStandardMaterial color="#e0e2da" roughness={.4} metalness={.12}/></mesh>
    <mesh position={[-1.16,0,.09]} castShadow><boxGeometry args={[.18,2.49,.09]}/><meshStandardMaterial color="#c8cec3" roughness={.4}/></mesh>
    <mesh position={[0,1.254,.065]}><boxGeometry args={[2.49,.014,.25]}/><meshBasicMaterial color={project.themeColor} toneMapped={false}/></mesh>
    <mesh position={[0,1.27,.06]} rotation={[-Math.PI/2,0,0]} renderOrder={2}>
      <planeGeometry args={[2.72,.56]}/>
      <shaderMaterial transparent depthWrite={false} toneMapped={false}
        uniforms={{tint:{value:new THREE.Color(project.themeColor)},strength:{value:selected?.72:.52}}}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv; uniform vec3 tint; uniform float strength;
          void main(){vec2 d=abs(vUv-.5);float glow=exp(-18.*d.y*d.y)*(1.-smoothstep(.44,.5,d.x));
          gl_FragColor=vec4(mix(tint,vec3(1.),.38),strength*glow);
          #include <colorspace_fragment>
          }`}/>
    </mesh>
    <SpineLabel project={project}/>
    <group position={[.08,0,.086]}>
      <mesh><ringGeometry args={[1.055,1.095,96]}/><meshStandardMaterial color="#b8bdb2" roughness={.46}/></mesh>
      <mesh position={[0,0,.006]}><ringGeometry args={[.073,.107,32]}/><meshStandardMaterial color="#a3aa9f" metalness={.28} roughness={.38}/></mesh>
      {[0,1,2].map(index=><mesh key={index} rotation={[0,0,index*Math.PI*2/3]} position={[0,0,.008]}>
        <ringGeometry args={[.14,.22,10,1,.18,1.68]}/><meshStandardMaterial color="#c7cbc1" roughness={.48}/>
      </mesh>)}
    </group>
    {withDisc && <group position={[.08,0,.12]}><Disc color={project.themeColor}/></group>}
    <group ref={lidRef} position={[-1.25,0,.13]}>
      <group position={[1.25,0,0]}>
        <Cover project={project}/>
        <mesh position={[0,0,.045]}><boxGeometry args={[2.5,2.5,.055]}/><meshPhysicalMaterial color="#f7fff8" transparent opacity={.14} roughness={.16} metalness={.18} depthWrite={false}/></mesh>
        {[0,1].map(axis => [-1,1].map(sign=><group key={`${axis}${sign}`} position={axis === 0 ? [sign*1.24,0,.06] : [0,sign*1.24,.06]}>
          <mesh><boxGeometry args={axis===0?[.025,2.5,.025]:[2.5,.025,.025]}/><meshStandardMaterial color={project.themeColor} emissive={project.themeColor} emissiveIntensity={selected?2:1} transparent opacity={selected?1:.88}/></mesh>
          {[1,2,3].map(n=><mesh key={n}><boxGeometry args={axis===0?[.025+n*.063,2.5,.026]:[2.5,.025+n*.063,.026]}/><meshBasicMaterial color={project.themeColor} transparent opacity={(selected?.28:.16)/n} depthWrite={false}/></mesh>)}
        </group>))}
      </group>
    </group>
    {[-1,1].map(s=><mesh key={s} position={[-1.24,s*.95,.1]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.16,12]}/><meshStandardMaterial color="#b7bdb5" metalness={.4} roughness={.3}/></mesh>)}
  </group>;
}
export function DecorativeCases({motion,browsing,projectCount}:{motion:React.RefObject<ArchiveMotion>;browsing:React.RefObject<{index:number}>;projectCount:number}) {
  const ref=useRef<THREE.InstancedMesh>(null!); const edgeRef=useRef<THREE.InstancedMesh>(null!);
  const dummy=useMemo(()=>new THREE.Object3D(),[]);
  const spineTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#efeee8';
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#b2b2a7';
    ctx.fillRect(0, 46, 512, 5);
    for (const x of [15, 23, 31, 464, 472, 480]) ctx.fillRect(x, 7, 5, 35);
    ctx.fillStyle = '#c5bba5';
    ctx.fillRect(55, 15, 102, 10);
    ctx.fillRect(55, 30, 51, 5);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => spineTexture.dispose(), [spineTexture]);
  const positions=useMemo(()=>decorativeColumns(projectCount),[projectCount]);
  useFrame(()=>{
    if (!motion.current.enabled && ref.current.instanceMatrix.version > 0) return;
    positions.forEach(([column,z],i)=>{
      const x = column - browsing.current.index * CASE_SPACING;
      const wave = waveOffset(x, z, motion.current, column);
      const hill = .48 * Math.exp(-x*x/3 - z*z/5);
      dummy.rotation.set(0, CASE_ANGLE, 0);
      dummy.position.set(x, -.32 + hill + entranceWave(x, z, motion.current) + wave, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      dummy.translateY(1.25);
      dummy.updateMatrix();
      edgeRef.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate=true;edgeRef.current.instanceMatrix.needsUpdate=true;
  });
  return <group>
    <instancedMesh ref={ref} args={[undefined,undefined,positions.length]} frustumCulled={false} receiveShadow raycast={()=>null}><boxGeometry args={[2.5,2.5,SHELL_THICKNESS]}/><meshStandardMaterial color="#e5e5de" roughness={.58}/></instancedMesh>
    <instancedMesh ref={edgeRef} args={[undefined,undefined,positions.length]} frustumCulled={false} raycast={()=>null}><boxGeometry args={[2.5,.022,SHELL_THICKNESS]}/><meshStandardMaterial map={spineTexture} roughness={.38}/></instancedMesh>
  </group>;
}
export function Player({ trayRef, color }: { trayRef: React.Ref<THREE.Group>; color: string }) {
  return <group>
    {/* The front slot is a real gap between separate chassis panels. */}
    <mesh position={[0,.65,-6.4]} castShadow><boxGeometry args={[24,1.1,14]}/><meshStandardMaterial color="#e2e4de" roughness={.34} metalness={.22}/></mesh>
    <mesh position={[0,-.25,-6.4]} castShadow><boxGeometry args={[24,.3,14]}/><meshStandardMaterial color="#d0d4cd" roughness={.4}/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*7.1,0,.55]}><boxGeometry args={[9.8,.25,.12]}/><meshStandardMaterial color="#dfe3d9" roughness={.35}/></mesh>)}
    <mesh position={[2.9,.65,.62]}><boxGeometry args={[1.7,.3,.025]}/><meshStandardMaterial color="#3c493f" roughness={.45}/></mesh>
    {[0,1,2,3,4].map(i=><mesh key={i} position={[2.4+i*.18,.65,.645]}><boxGeometry args={[.08,.1,.01]}/><meshBasicMaterial color={color}/></mesh>)}
    <mesh position={[-3.5,.6,.65]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.16,.16,.08,32]}/><meshStandardMaterial color="#adb6ab" metalness={.6} roughness={.3}/></mesh>
    <group ref={trayRef}>
      <mesh position={[0,-.015,-.8]} castShadow><boxGeometry args={[2.8,.09,2.8]}/><meshStandardMaterial color="#aeb9ac" roughness={.45} metalness={.25}/></mesh>
      <mesh position={[0,.035,-.8]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.16,1.11,64]}/><meshStandardMaterial color="#7f8d7d" roughness={.6}/></mesh>
      <mesh position={[0,-.015,.64]}><boxGeometry args={[3,.19,.12]}/><meshStandardMaterial color="#e7eae2" roughness={.35}/></mesh>
    </group>
  </group>;
}
