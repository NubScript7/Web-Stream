// streamer.js
const socket = io();
let peerConnection;

// Get access to user media (camera, screen)
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', startStreaming);

async function startStreaming() {
  startButton.disabled = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;

    // Create a new PeerConnection
    peerConnection = new RTCPeerConnection();

    // Add the local stream to the PeerConnection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Create an offer and set it as the local description
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer to the server
    socket.emit('offer', { offer, streamerId: socket.id });

    console.log('Streaming started successfully.');
  } catch (error) {
    console.error('Error accessing user media:', error);
    startButton.disabled = false;
  }
}
