import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('all project records have distinct colors, safe source links, and complete editorial sections',async()=>{
  const files=(await readdir(new URL('../src/content/projects/',import.meta.url))).filter(f=>f.endsWith('.mdx'));
  assert.equal(files.length,4);const colors=new Set();
  for(const file of files){const text=await readFile(new URL('../src/content/projects/'+file,import.meta.url),'utf8');
    const color=text.match(/themeColor: "(#[a-f0-9]{6})"/i)?.[1];assert.ok(color);colors.add(color);
    assert.match(text,/githubUrl: "https:\/\/github.com\/Asher-BoSiang\//);
    for(const section of ['Overview','System architecture','Implementation','Technical challenges','Results'])assert.ok(text.includes('## '+section),file+' missing '+section);
    assert.ok(!text.includes('acoustic-water-level-estimation'),'Unapproved private repository content must not be included');
  }
  assert.equal(colors.size,files.length);
});
test('built static project routes contain actual readable content',async()=>{
  const files=(await readdir(new URL('../src/content/projects/',import.meta.url))).filter(f=>f.endsWith('.mdx'));
  for(const file of files){const html=await readFile(new URL('../dist/projects/'+file.replace('.mdx','')+'/index.html',import.meta.url),'utf8');assert.match(html,/System architecture/);assert.match(html,/Technical challenges/);assert.match(html,/rel="canonical"/);}
});
