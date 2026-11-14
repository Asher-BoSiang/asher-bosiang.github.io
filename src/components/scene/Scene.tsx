import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DecorativeCases, Disc, JewelCase, Player } from './Models';
import { initialPose, createOpeningTimeline, CASE_ANGLE, ROW_ANGLE, CASE_SPACING, SELECTED_HEIGHT, entranceWave, idleWave, selectionHeight, waveOffset, type ArchiveInput, type ArchiveMotion } from './motion';
import type { Phase, Project } from '../../data/types';
export interface SceneProps { input:React.RefObject<ArchiveInput>; projects: Project[]; selected: number; phase: Phase; reduced: boolean; onPhase: (p: Phase)=>void; onSelect: (index:number)=>void; onReady: ()=>void; onFailure: ()=>void }
function World({input,projects, selected, phase, reduced, onPhase, onSelect, onReady}:SceneProps) {
  const { camera, size, invalidate, gl, scene } = useThree();
  const pose = useRef(initialPose());
  const motion=useRef<ArchiveMotion>({time:0,pulseAt:-10,pulseX:0,releasedX:Infinity,enteredAt:performance.now()/1000,x:0,y:0,drag:0,energy:0,enabled:true,reduced});
  useEffect(()=>{input.current.invalidate=invalidate;return()=>{input.current.invalidate=()=>{};};},[input,invalidate]);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const browsing = useRef({ index:selected });
  const insertOnEntry = useRef(false);
  const heights = useRef<number[]>([]);
  const liftStart = useRef(0);

  const shelf = useRef<THREE.Group>(null!);
  const active = useRef<THREE.Group>(null!);
  const lid = useRef<THREE.Group>(null!);
  const disc = useRef<THREE.Group>(null!);
  const player = useRef<THREE.Group>(null!);
  const tray = useRef<THREE.Group>(null!);
  const matrixAnchor = useRef(new THREE.Object3D());
  const worldPosition = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const rotation = useRef(new THREE.Quaternion());
  const flatRotation = useRef(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
  const currentPhase = useRef(phase); currentPhase.current=phase;
  useEffect(()=>{onReady();},[onReady]);
  useEffect(()=>{const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(gl);const map=pmrem.fromScene(environment,.06);scene.environment=map.texture;scene.environmentIntensity=.35;invalidate();return()=>{scene.environment=null;map.dispose();pmrem.dispose();environment.dispose();};},[gl,scene,invalidate]);
  useEffect(()=>{
    const mobile=size.width<760;
    camera.position.set(mobile?8.6:10,mobile?9.1:9,10);
    if(camera instanceof THREE.OrthographicCamera) camera.zoom=mobile?size.width/7:Math.min(size.width/13.6,size.height/8);
    camera.lookAt(mobile?-1.4:0,mobile?.6:.5,0); camera.updateProjectionMatrix(); invalidate();
  },[camera,size.width,size.height,invalidate]);
  useLayoutEffect(()=>{
    liftStart.current = heights.current[selected] ?? 0;
    motion.current.releasedX = motion.current.pulseX === selected * CASE_SPACING ? Infinity : motion.current.pulseX;
    motion.current.pulseX = selected * CASE_SPACING;
    motion.current.pulseAt=performance.now()/1000;
    const tween=gsap.to(browsing.current,{index:selected,duration:reduced?0:.6,ease:'power3.out',onUpdate:invalidate});
    return ()=>{tween.kill();};
  },[selected,reduced,invalidate]);
  useLayoutEffect(()=>{
    if(phase==='Extracting') {
      insertOnEntry.current=false;
      timeline.current?.kill();
      pose.current.x=active.current.position.x+2;pose.current.y=active.current.position.y+.5;pose.current.z=active.current.position.z;
      browsing.current.index=selected;
      timeline.current=createOpeningTimeline(pose.current,onPhase,()=>onPhase('Details'));
      timeline.current.eventCallback('onUpdate',invalidate);
      timeline.current.play();
      if(reduced) timeline.current.progress(1);
    } else if(phase==='Details' && reduced) {
      Object.assign(pose.current,{x:1.5,y:1.4,z:2.2,ry:.5,rx:-.25,scale:1.2,lid:-2.45,discOut:1.8,discTravel:1,shelfY:-7,caseExit:-12,playerY:2.5,tray:0});invalidate();
    } else if(phase==='Returning') {
      insertOnEntry.current=true;
      const tl=timeline.current;
      if(tl) { tl.eventCallback('onReverseComplete',()=>{onPhase('Collection');invalidate();}); tl.timeScale(1.35).reverse(); if(reduced) {tl.progress(0).pause();onPhase('Collection');} }
      else {Object.assign(pose.current,initialPose());onPhase('Collection');}
    } else if(phase==='Collection' || phase==='Profile') {
      if(phase==='Profile') insertOnEntry.current=false;
      timeline.current?.kill(); timeline.current=null; Object.assign(pose.current,initialPose());motion.current.enteredAt=performance.now()/1000;invalidate();
    }
  },[phase,reduced,onPhase,invalidate]);
  useEffect(()=>()=>{timeline.current?.kill();},[]);
  useEffect(() => {
    if (phase !== 'Collection' || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [phase, reduced, invalidate]);
  useFrame((_,delta)=>{
    const p=pose.current;const m=motion.current;const inputValue=input.current;const dt=Math.min(delta,.05);
    m.time=performance.now()/1000;m.enabled=phase==='Collection';m.reduced=reduced;
    const previousX=m.x;const previousY=m.y;const previousDrag=m.drag;
    m.x=THREE.MathUtils.damp(m.x,inputValue.x,9,dt);m.y=THREE.MathUtils.damp(m.y,inputValue.y,9,dt);m.drag=THREE.MathUtils.damp(m.drag,inputValue.drag,12,dt);
    m.energy=Math.max(m.energy,inputValue.energy);inputValue.energy=0;m.energy=THREE.MathUtils.damp(m.energy,0,3.5,dt);
    const driftX=m.enabled&&!reduced?m.x*.28+m.drag:0;const driftZ=m.enabled&&!reduced?m.y*.14:0;
    const pulseAge=Math.max(0,m.time-m.pulseAt);
    const rowOffset=(selected-browsing.current.index)*CASE_SPACING;
    const lift = reduced ? SELECTED_HEIGHT : selectionHeight(liftStart.current, pulseAge, idleWave(rowOffset,0,m.time));
    if (m.enabled) heights.current[selected] = lift;
    const age = m.time - m.enteredAt;
    const insertion = insertOnEntry.current && !reduced
      ? 12 * (1 - THREE.MathUtils.clamp((age-1.8)/.53,0,1))**3
      : entranceWave(rowOffset,0,m);
    const activeY = m.enabled ? lift + insertion : p.y;
    const archivesReturning = phase === 'Returning';
    shelf.current.visible = !archivesReturning && p.shelfY > -4;
    if(m.enabled&&!reduced&&(m.time-m.enteredAt<2.5||m.time-m.pulseAt<4.5||Math.abs(m.x-previousX)+Math.abs(m.y-previousY)+Math.abs(m.drag-previousDrag)>.0001||m.energy>.002))invalidate();
    shelf.current.rotation.y=ROW_ANGLE;
    shelf.current.position.set(-2+driftX*.707,-.5+p.shelfY,driftZ-driftX*.707);
    active.current.position.set(-2+p.x+driftX*.707,activeY-.5+p.caseExit+(archivesReturning ? 12*(1-THREE.MathUtils.clamp((timeline.current?.time() ?? 1)/.9,0,1))**2 : 0),p.z+driftZ-driftX*.707-(m.enabled?rowOffset:0));
    active.current.rotation.set(p.rx,p.ry,0); active.current.scale.setScalar(p.scale);
    lid.current.rotation.y=p.lid;
    player.current.position.set(0,p.playerY,-1.2);
    tray.current.position.z=p.tray;
    // The free disc shares the case transform until extraction, then follows a world-space arc.
    const a=matrixAnchor.current;
    a.position.copy(active.current.position);a.position.y-=p.caseExit; a.rotation.set(p.rx,p.ry,0);a.scale.setScalar(p.scale);a.updateMatrixWorld();
    worldPosition.current.set(.08,0,.12+p.discOut).applyMatrix4(a.matrixWorld);
    target.current.set(0,p.playerY+.065,-2+p.tray);
    disc.current.position.copy(worldPosition.current).lerp(target.current,p.discTravel);
    disc.current.position.y+=Math.sin(Math.PI*p.discTravel)*1.2;
    rotation.current.setFromEuler(a.rotation);
    disc.current.quaternion.copy(rotation.current).slerp(flatRotation.current,p.discTravel);
    disc.current.scale.setScalar(THREE.MathUtils.lerp(p.scale,1,p.discTravel));
    // The disc and tray use the same moving target after loading; no reparenting jump.
    disc.current.visible=currentPhase.current!=='Profile' && active.current.visible;

  }, -1);
  const busy = !['Profile','Collection'].includes(phase);
  return <>
    <color attach="background" args={['#eeeee7']}/><fog attach="fog" args={['#eeeee7',24,46]}/>
    <ambientLight intensity={.8}/><hemisphereLight args={['#fffdf4','#9ea497',.75]}/>
    <directionalLight position={[-4,10,7]} intensity={2.1} castShadow shadow-radius={4} shadow-mapSize={[512,512]} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-.001}/>
    <group ref={shelf}>
      <DecorativeCases motion={motion} browsing={browsing} projectCount={projects.length}/>
      {projects.map((p,i)=>i===selected?null:<MovingCase key={p.slug} project={p} index={i} browsing={browsing} motion={motion} heights={heights} onSelect={()=>!busy&&onSelect(i)}/>)}
    </group>
    <group ref={active} onClick={e=>{e.stopPropagation(); if(!busy&&phase==='Collection'&&e.delta<6) onPhase('Extracting');}}>
      <JewelCase project={projects[selected]} lidRef={lid} selected withDisc={false}/>
    </group>
    <group ref={disc}><Disc color={projects[selected].themeColor}/></group>
    <group ref={player}><Player trayRef={tray} color={projects[selected].themeColor}/></group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.78,0]} receiveShadow><planeGeometry args={[120,120]}/><meshStandardMaterial color="#eeeee7" roughness={1}/></mesh>
  </>;
}
function MovingCase({project,index,browsing,motion,heights,onSelect}:{project:Project;index:number;browsing:React.RefObject<{index:number}>;motion:React.RefObject<ArchiveMotion>;heights:React.RefObject<number[]>;onSelect:()=>void}) {
  const ref=useRef<THREE.Group>(null!);
  const release = useRef<number | null>(null);
  useFrame((_,dt)=>{
    const m = motion.current;
    const x = (index - browsing.current.index) * CASE_SPACING;
    const wave = waveOffset(x,0,m,index*CASE_SPACING);
    if (release.current === null) release.current = (heights.current[index] ?? wave) - wave;
    release.current = m.reduced ? 0 : THREE.MathUtils.damp(release.current,0,6,Math.min(dt,.05));
    const height = wave + release.current;
    heights.current[index] = height;
    ref.current.position.set(x,height + entranceWave(x,0,m),0);
    ref.current.rotation.z = 0;
  });
  return <group ref={ref} rotation={[0,CASE_ANGLE,0]} onClick={e=>{e.stopPropagation();if(e.delta<6)onSelect();}}><JewelCase project={project} selected={false}/></group>;
}
class Boundary extends Component<{ children:ReactNode; onFailure:()=>void },{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?null:this.props.children;}
}
export default function Scene(props:SceneProps) {
  const [contextLost,setContextLost]=useState(false);
  return <Boundary onFailure={props.onFailure}>{!contextLost&&<Canvas orthographic frameloop="demand" shadows dpr={[1,1.25]} camera={{zoom:80,near:.1,far:100}} gl={{antialias:true,alpha:false,powerPreference:'default'}} onCreated={({gl})=>{
    gl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setContextLost(true);props.onFailure();},{once:true});
  }}><World {...props}/></Canvas>}</Boundary>;
}
