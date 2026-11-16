import { test, expect } from '@playwright/test';

test('profile, collection, complete loading sequence, and reverse preserve selection', async ({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1272,height:650});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Asher Wang.'})).toBeVisible();
  await page.getByRole('button',{name:'Explore Projects'}).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Collection');
  await expect(page.getByRole('button',{name:'Open project',exact:false})).toBeEnabled({timeout:20000});
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Next project',exact:true}).click();
  await expect(page.locator('.project-overview h3')).toHaveText('Intelligent Cockpit HMI');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.project-overview h3')).toHaveText('Bicycle Energy Recovery');
  const collectionBounds = await page.locator('.scene-window').boundingBox();
  await page.getByRole('button',{name:'Open project',exact:false}).click();
  await expect(page.locator('.experience')).not.toHaveAttribute('data-phase','Collection');
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Details',{timeout:30000});
  await expect(page.locator('.project-article:visible')).toContainText('Bicycle Energy Recovery');
  await expect(page.locator('.project-article:visible')).toHaveCSS('opacity','1');
  expect(await page.locator('.scene-window').boundingBox()).toEqual(collectionBounds);
  await page.getByRole('button',{name:'Back to Collection',exact:false}).first().click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Collection',{timeout:30000});
  await expect(page.locator('.project-overview h3')).toHaveText('Bicycle Energy Recovery');
  await page.getByRole('button',{name:'Back to Profile',exact:false}).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Profile');
  expect(errors).toEqual([]);
});

test('fallback, static pages, and text index remain usable',async({page})=>{
  await page.goto('/?no3d');
  await page.getByRole('button',{name:'Explore Projects'}).click();
  await expect(page.locator('.fallback-art')).toBeVisible();
  await page.getByRole('button',{name:'Open project',exact:false}).click();
  await expect(page.locator('.project-article:visible')).toContainText('STM32 Peripheral System');
  await page.getByRole('button',{name:'Back to Collection',exact:false}).first().click();
  await page.getByRole('button',{name:'Text index',exact:false}).click();
  await page.locator('.overlay-index').getByRole('link',{name:/Four-MCU/}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Four-MCU Memory Game');
  await expect(page.getByRole('heading',{name:'Technical challenges'})).toBeVisible();
});

test('mobile swipe and reduced motion',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Explore Projects'}).click();
  await expect(page.locator('.scene-window canvas')).toBeVisible({timeout:15000});
  await page.locator('.scene-window').dispatchEvent('pointerdown',{clientX:300,clientY:280,pointerType:'touch'});
  await page.locator('.scene-window').dispatchEvent('pointerup',{clientX:100,clientY:280,pointerType:'touch'});
  await expect(page.locator('.project-overview h3')).toHaveText('Intelligent Cockpit HMI');
  await page.getByRole('button',{name:'Open project',exact:false}).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Details');
  await expect(page.locator('.project-article:visible')).toContainText('withheld under NDA');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Collection');
});

test('cancel an in-flight animation and replay safely',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Explore Projects'}).click();
  await page.getByRole('button',{name:'Open project',exact:false}).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase',/Extracting|Opening|DiscFloating|PlayerEntering|TrayExtending|DiscLoading/,{timeout:10000});
  await page.keyboard.press('Escape');
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Collection',{timeout:30000});
  await page.getByRole('button',{name:'Open project',exact:false}).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-phase','Details',{timeout:30000});
});

test('project content works without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await page.locator('#project-index').getByRole('link',{name:/STM32/}).click();
  await expect(page.getByRole('heading',{name:'STM32 Peripheral System',exact:true})).toBeVisible();
  await context.close();
});


test('wheel and pointer motion move the archive without scrolling the page',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Explore Projects'}).click();
  await expect(page.getByRole('button',{name:'Open project',exact:false})).toBeEnabled({timeout:20000});
  await page.mouse.move(700,450);await page.mouse.wheel(0,150);
  await expect(page.locator('.project-overview h3')).toHaveText('Intelligent Cockpit HMI');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  const canvas=await page.locator('canvas').elementHandle();
  await page.locator('.scene-window').dispatchEvent('pointerdown',{clientX:750,clientY:450,pointerType:'mouse'});
  await page.locator('.scene-window').dispatchEvent('pointermove',{clientX:550,clientY:470,pointerType:'mouse'});
  await page.locator('.scene-window').dispatchEvent('pointerup',{clientX:550,clientY:470,pointerType:'mouse'});
  await expect(page.locator('.project-overview h3')).toHaveText('Bicycle Energy Recovery');
  expect(await canvas?.evaluate(el=>el.isConnected)).toBeTruthy();
  await page.getByRole('button',{name:'Back to Profile',exact:false}).click();
  await page.getByRole('button',{name:'Explore Projects'}).click();
  expect(await canvas?.evaluate(el=>el.isConnected)).toBeTruthy();
});

test('primary actions fit without scrolling in short and narrow windows',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [width,height] of [[1272,650],[1024,540],[390,667]]){
    await page.setViewportSize({width,height});
    await page.goto('/?no3d');
    const explore=page.getByRole('button',{name:'Explore Projects'});
    await expect(explore).toBeInViewport({ratio:1});
    await expect(page.locator('.contact-links a').first()).toBeInViewport({ratio:1});
    await explore.click();
    for(const name of [/Open project/,/Previous project/,/Next project/]){
      await expect(page.getByRole('button',{name})).toBeInViewport({ratio:1});
    }
    expect(await page.evaluate(()=>scrollY)).toBe(0);
  }
});
