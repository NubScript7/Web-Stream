const lz = LZString;
const socket = io();
const debugr = {
  _ping:  0,
   sub: false,
  rPing: (-1),
  recon: 0,
}
const streamEl = document.getElementById('streamInp');
const imgEl = document.getElementById('stream');
const reqBtn = document.getElementById('reqStream');
const mode = document.getElementById('mode');
const pingEl = document.getElementById('pingEl');

reqBtn.addEventListener('click',()=>{
    if(mode.value==='regular'){
        socket.emit('subscribe',streamEl.value)
    }else if(mode.value==='c-mode'){
        socket.emit('req_c-stream',streamEl.value)
    }
    debugr.subd=true;
})  
    
socket.on('requested-frame',frame=>{
    imgEl.src=frame;
    debugr._ping++
})
    
socket.on('requested-cframe',(frame,ping)=>{
    //let dframe = lz.decompress(frame);
    imgEl.src=frame;
    debugr._ping++;
    pingEl.textContent = `ping: ${Date.now() - ping}`;
})
    
setInterval(()=>{
    if(!debugr.subd)return;
    
    if(debugr.rPing===debugr._ping&&debugr.recon<3){
        debugr.recon++
        console.warn('connection interrupted. reconnecting...');
        reqBtn.click();
    }else if(debugr.rPing===debugr._ping&&debugr.recon>2&&mode.value==='regular'){
        debugr.recon++;
        socket.emit('recon-notice',streamEl.value);
        reqBtn.click();
    }else if(debugr.rPing===debugr._ping&&debugr.recon>2&&mode.value==='c-mode'){
        debugr.recon++;
        reqBtn.click();
    }else{
        debugr.rPing=debugr._ping;
    }
},5000)