import io from 'socket.io-client';
const socket = io('http://localhost:8001');

socket.on('connect', ()=>{
    console.log("Connected");
    socket.emit('clientConnect');
})

socket.on('welcome', (data)=>{
    console.log(data);
})