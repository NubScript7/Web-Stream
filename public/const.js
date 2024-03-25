//const lz = LZString;
const socket = io();
const id = localStorage.getItem('Stream-Constant-Identifier') || prompt('permanent id:');
if(!id){
  location.reload()
}else{
  localStorage.setItem('Stream-Constant-Identifier',id)
}

const viewEl = document.getElementById('viewers');
const sInfo = document.getElementById('info');
const videoEl = document.getElementById('videoEl');
const imageEl = document.getElementById('animate_img');

sInfo.textContent='permanent id: '+localStorage.getItem('Stream-Constant-Identifier');

socket.on("update-views", viewCount => {
  viewEl.textContent = `view count: ${viewCount}`
})

socket.emit('c-mode_recon',id)

navigator.mediaDevices.getUserMedia({ video: {facingMode: {exact: 'environment'}} })
.then(stream => {

    videoEl.srcObject = stream;
    videoEl.play();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frameRate = localStorage.getItem('CSF') || 12;

    function captureFrame() {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        const frameUrl = canvas.toDataURL('image/jpeg');
        //const minFrame = lz.compress(frameUrl);
        socket.volatile.emit('c-mode_stream',id,frameUrl,Date.now());

        setTimeout(captureFrame, 1000 / frameRate);
    }
    captureFrame();
})
.catch(error => {
    console.error('Error accessing the camera:', error);
});