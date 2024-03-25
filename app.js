const ip = require("./ip");
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000
const livePorts = {};
const subscribedIds = {};
const peers = {};
const constStream = {};
const cModeSub = {};
const watchingStreamers = {}

app.set('view engine','ejs');
app.use(express.json());

function generateId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 5;
  let id = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters.charAt(randomIndex);
  }

  return id;
}

app.use('/public',express.static('public'))

app.get("/receiver", (req,res) => {
  res.render("receiver")
})

app.get("/const", (req, res) => {
  res.render("const")
})

io.on('connection',socket=>{
  console.log(socket.id)
  socket.on('request-live',name=>{
    let id = generateId();
    console.log(id)
    livePorts[id]={
      sid: socket.id,
      id,
      name,
      views: 0,
      ms: 0,
      frame: ''
    }
    io.to(socket.id).emit('live-config',livePorts[id])
  })

  socket.on('img-stream',(id,imgData)=>{
    livePorts[id].frame=imgData;
    Object.keys(subscribedIds).forEach(e=>{
      io.to(e).emit('requested-frame',livePorts[subscribedIds[e]].frame)
    })
  })
  
  socket.on('subscribe',id=>{
    if(!livePorts[id])return;
    subscribedIds[socket.id]=id;
    livePorts[id].views+=1;
    io.to(livePorts[id].sid).emit('views-update',livePorts[id].views)
  })
  
  socket.on('direct-stream',frame=>{
		socket.broadcast.emit('direct-stream',frame)
  })
  
  socket.on('recon-notice',id=>{
    console.log(socket.id+' sent a recon notice to '+livePorts[id].sid);
    io.to(livePorts[id].sid).emit('force-rest');
  })
  
  socket.on('peer-call',()=>{
  	let id = generateId();
  	peers[id]={
  		recon: false,
      id: id,
      sid: socket.id,
      callee: {
      	recon: false,
      	sid: '',
      	frame: ''
      },
      frame: ''
    }
  	io.to(socket.id).emit('peer-config',peers[id])
  })
  
  socket.on('peer-answer',id=>{
  	peers[id].callee.sid = socket.id;
  	io.to(peers[id].sid).emit('peer-answer',peers[id])
  })
  
  socket.on('peer-frame',(id,imgData,role)=>{
  	if(role === 'callee'){
  		peers[id].callee.frame = imgData;
  		io.to(peers[id].sid).emit('peer-frame',imgData);
  	}else if(role === 'caller'){
  		peers[id].frame = imgData;
  		io.to(peers[id].callee.sid).emit('peer-frame',imgData);
  	}
  })
  
  socket.on('peer-reconnect',config=>{
  	if(config.id in peers !== true)return io.to(socket.id).emit('peer-cancelled');
  	peers[config.id].recon = true;
  	peers[config.id].sid = socket.id;
  })
  
  socket.on('audio',(port,blob)=>{
    if(!port)return;
    io.emit(`audio:${port}`,blob);
  })
  
  socket.on('c-mode_recon',id=>{
    socket.join(id)
    constStream[id]={
      cid: id,
      sid: socket.id,
      frame: '',
      ms: 0,
      views: 0
    }
  })
  
  socket.on('c-mode_stream',(id,imgData,ms)=>{
    if(id in constStream !== true)
      return
    constStream[id].ms = ms;
    
    socket.emit("c-mode_ms", constStream[id].ms)
    constStream[id].frame=imgData;
    Object.keys(cModeSub).forEach(e=>{
      io.to(e).emit('requested-cframe',imgData,constStream[id].ms)
    })
  })
  
  socket.on('req_c-stream',id=>{
    if (!!constStream[id]) {
      constStream[id].views += 1;
      if (!watchingStreamers[socket.id]) {
          watchingStreamers[socket.id] = [id]
      } else {
          if (watchingStreamers[socket.id].indexOf(id) !== '-1')
            watchingStreamers[socket.id].push(id)
      }
      io.to(id).emit("update-views",constStream[id].views)
    }
    cModeSub[socket.id]=id
  })
  
	socket.on('disconnect',()=>{
		console.log(socket.id+' disconnected');
		if(socket.id in subscribedIds){
			delete subscribedIds[socket.id]
		}
		if(watchingStreamers[socket.id] && watchingStreamers[socket.id].length >= 1) {
		  watchingStreamers[socket.id].forEach(id => {
		    console.log(id, constStream[id])
		    if(!!constStream[id]) {
		      constStream[id].views -= 1;
		      io.to(id).emit("update-views", constStream[id].views)
		    }
		  })
		}
		


			Object.keys(peers).forEach(e=>{
				if(e.sid === socket.id){
					if(e.recon)return;
		            setTimeout(()=>{
				    	e.callee.sid!==''?
					    io.to(e.callee.sid).emit('peer-disconnect'):
			    		false;
				    	delete peers[e]
					},10000)
				}
			})
	})

})



server.listen(PORT,()=>{
  console.log('server listening at port '+PORT);
  console.log('ip domain: '+ip.address());
})
	
