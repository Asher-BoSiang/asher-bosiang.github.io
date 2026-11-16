import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, PerspectiveCamera } from 'three';
import { ROW_ANGLE, CASE_ANGLE, decorativeColumns, selectionHeight, SELECTED_HEIGHT, idleWave, waveOffset, initialPose, createOpeningTimeline } from '../src/components/scene/motion.ts';

test('case width follows the project row and blank cases fill its face-normal axis',()=>{
  assert.equal(CASE_ANGLE,0);
  const cells = decorativeColumns(4);
  for(let project=0; project<4; project++){
    const depths = cells.filter(([x])=>Math.abs(x-project*2.66)<.001).map(([,z])=>z);
    assert.ok(depths.includes(.38) && depths.includes(-.38));
    assert.ok(!depths.includes(0));
  }
  const camera=new PerspectiveCamera(38,1.5,.1,100);
  camera.position.set(10,9,10);camera.lookAt(0,.5,0);camera.updateMatrixWorld();
  const center = new Vector3(0,1.25,0).project(camera);
  const edge = new Vector3(Math.cos(ROW_ANGLE+CASE_ANGLE),1.25,-Math.sin(ROW_ANGLE+CASE_ANGLE)).project(camera);
  assert.ok(edge.x>center.x && edge.y>center.y);
});
test('selection rises monotonically with decreasing speed, then blends into idle motion',()=>{
  const start = .12;
  let last = start, lastStep = Infinity;
  for(let i=1;i<=52;i++){
    const height = selectionHeight(start,i/100,-.09);
    assert.ok(height>=last && height-last<=lastStep+1e-10 && height<=SELECTED_HEIGHT);
    lastStep=height-last;last=height;
  }
  assert.equal(last,SELECTED_HEIGHT);
  assert.equal(selectionHeight(start,10,.05),SELECTED_HEIGHT+.05);
});
test('settled cases keep a low-amplitude travelling wave without input',()=>{
  const m={enteredAt:0,pulseAt:-100,releasedX:Infinity,pulseX:0,x:0,y:0,drag:0,energy:0,enabled:true,reduced:false};
  const samples = Array.from({length:200},(_,i)=>waveOffset(0,0,{...m,time:100+i/20}));
  assert.ok(Math.max(...samples)-Math.min(...samples)>.1);
  assert.ok(samples.every(height=>Math.abs(height)<.1));
  assert.notEqual(idleWave(0,0,100),idleWave(0,3,100));
});
test('selection ripple reaches nearby cases first and decays back to rest',()=>{
  const m={time:100.1,enteredAt:0,pulseAt:100,releasedX:-2.59,pulseX:0,x:0,y:0,drag:0,energy:0,enabled:true,reduced:false};
  const ripple=(x,z,t)=>waveOffset(x,z,{...m,time:t})-waveOffset(x,z,{...m,time:t,pulseAt:-100});
  assert.ok(ripple(0,.28,100.4)>.2);
  assert.equal(ripple(0,2,100.1),0);
  assert.ok(ripple(0,2,100.8)>0);
  for (const depth of [-.56,.28,1.4]) {
    for (const age of [.1,.4,.7,.9,1.2]) {
      const released = ripple(-2.59,depth,100+age);
      assert.ok(released<=0);
      for (const column of [-5.18,2.59,10.36]) {
        assert.ok(Math.abs(ripple(column,depth,100+age)-released*.8)<1e-10);
      }
    }
  }
  assert.ok(ripple(-2.59,.28,100.4)<-.2);
  assert.equal(ripple(0,.28,102),0);
  assert.equal(waveOffset(0,0,{...m,reduced:true}),0);
});
test('lid stays shut throughout vertical extraction and opens in clear space; tray retracts only after the disc arrives',()=>{
  const p=initialPose();const tl=createOpeningTimeline(p,()=>{},()=>{});
  tl.seek(.54,true);assert.equal(p.x,0);assert.equal(p.z,0);assert.equal(p.lid,0);assert.ok(p.y>3 && p.shelfY < -4);
  tl.seek(.75,true);assert.ok(p.x>0&&p.x<1.5);assert.ok(p.lid<0&&p.lid>-2.45);
  tl.seek(2.49,true);assert.ok(p.discTravel<1);assert.equal(p.tray,2.5);
  tl.seek(2.6,true);assert.equal(p.discTravel,1);assert.ok(p.tray<2.5);
  assert.equal(tl.duration(),3);tl.kill();
});
