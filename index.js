const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:8080']
  }
});

connections = new Map();
users = new Map();

io.on('connection', (socket) => {
  let token = socket.handshake.auth.token;
  console.log(`a user connected with ${token}`);
  if(connections.has(token)){
    connections.get(token).push(socket);
  }
  socket.on('connect-mobile', () => {
    var password = Math.floor(Math.random() * 8999)+1000
    console.log(password);
    connections.set(password+"",[socket]);
    users.set(socket,password+"");
    socket.emit('count',"0")
    console.log('mobile user: ' +password);
    socket.emit('password', `${password}`);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
    if(users.has(socket)){
        console.log('device disconnected stuff');
        connections.get(users.get(socket)).forEach((device)=>device.emit('count',connections.get(users.get(socket)).length-2+""));
        let index = connections.get(users.get(socket)).findIndex(prop => prop == socket);
        connections.get(users.get(socket)).splice(index,1);
        if(connections.get(users.get(socket)).length==0){
            connections.delete()
        }
        users.delete(socket);
    }
    
  });
  socket.on('exit', (msg) => {
    console.log('exit: ' + msg);
    socket.emit('count',0+"")
    connections.get(users.get(socket)).forEach(device => {
     device.emit('close-window', true);  
    }); 
  });
  socket.on('search', (msg) => {
    console.log('message: ' + msg +" "+connections.has(msg));
    if(connections.has(msg)){
        users.set(socket,msg);
        connections.get(msg).push(socket);
        connections.get(msg).forEach((device)=>{
            device.emit('count',connections.get(msg).length-1+"")
        });
    }
    console.log(connections.keys());
    socket.emit('search result', `${connections.has(msg)}`);
  });
  socket.on('my message', (msg) => {
    console.log('message: ' + msg);
    io.emit('my broadcast', `server: ${msg}`);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});