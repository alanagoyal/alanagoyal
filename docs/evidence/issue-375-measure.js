const p=await browser.getPage('main');
await p.setViewport({width:1280,height:800});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
for(const [name,port] of [['before',3011],['after',3010]]) {
 await p.goto(`http://localhost:${port}`);
 await p.waitForSelector('button[aria-label="Resize Dock"]');
 await p.evaluate(()=>{localStorage.setItem('theme','light');document.documentElement.classList.remove('dark')});
 await pause(500);
 const read=()=>p.evaluate(()=>{
 const d=document.querySelector('button[aria-label="Resize Dock"]').parentElement.parentElement;
 return {width:d.getBoundingClientRect().width,items:Array.from(d.children).filter(e=>e.tagName==='BUTTON').map(e=>({name:e.getAttribute('aria-label'),target:parseFloat(e.style.width),actual:e.getBoundingClientRect().width}))};
 });
 const output=[];
 // Same screen path, 2px steps through divider; pause long enough to settle each target.
 for(let x=790;x<=900;x+=2){await p.mouse.move(x,748);await pause(120);output.push({x,...await read()})}
 console.log(JSON.stringify({name,output}));
 await p.mouse.move(640,500);await pause(300);
 // Approach one icon from each direction, ending at exactly the same point.
 const paths=[];
 for(const start of [400,850]){await p.mouse.move(start,748);await pause(200);await p.mouse.move(650,748);await pause(200);paths.push(await read());await p.mouse.move(640,500);await pause(200)}
 console.log(JSON.stringify({name,paths}));
}
