// viewer.js
const socket = io();
let peerConnection;

const codeInput = document.getElementById('codeInput');
codeInput.addEventListener('keydown', handleCodeInput);

function handleCodeInput(event) {
  if (event.key === 'Enter') {
    const streamCode = codeInput.value.trim();
    codeInput.value = '';

    // Request the server to start streaming with the specified code
    socket.emit('requestStream', streamCode);
  }
}

// Receive the offer from the server
socket.on('offer', async (offer) => {
  // Create a new PeerConnection
  peerConnection = new RTCPeerConnection();

  // Add the received offer as the remote description
  await peerConnection.setRemoteDescription(offer);

  // Create an answer and set it as the local description
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Send the answer to the server
  socket.emit('answer', { answer, streamerId: offer.streamerId });
});

// Receive the ICE candidate from the server
socket.on('iceCandidate', (candidate) => {
  // Add the received ICE candidate to the PeerConnection
  peerConnection.addIceCandidate(candidate);
});

// Set up the video stream when the PeerConnection is established
peerConnection.addEventListener('connectionstatechange', () => {
  if (peerConnection.connectionState === 'connected') {
    console.log('PeerConnection established. Starting video stream...');
    const remoteVideo = document.getElementById('remoteVideo');

    // Display the remote video stream
    remoteVideo.srcObject = peerConnection.remoteStreams[0];
  }
});
