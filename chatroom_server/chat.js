// Import necessary modules
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');
const Room = require('./classes/Room')

const app = express();

// Apply CORS middleware to allow cross-origin requests
app.use(cors());

// Create an HTTP server by passing in the Express app
const server = http.createServer(app);

// Connect with react
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

//namespaces
const namespaces = require('./data/namespaces');

/*
app.get('/change-ns', (req, res) => {
    namespaces[0].addRoom(new Room(4, 'Deleted Articles', 0));
    io.of(namespaces[0].endpoint).emit('name_space_change', namespaces[0]);
    res.json(namespaces[0]);
})*/

//mainsocket connection
io.on('connection', (socket) => {
    //console log when a client connects
    console.log(`${socket.id} has connected`);

    // namespace video
    socket.on('clientConnect', (data)=>{
        console.log(`${socket.id} has connected 2`);
    })
    socket.emit('nameSpacesList', namespaces);
    //

    // Send a welcome message to the connected client
    socket.emit('messageFromServer', { data: `${socket.id} has connected` });

    socket.on('newFileToServer', (fileData) => {
        //console.log(fileData.fileName);
        io.emit('newFileToClients', fileData);
    });
  

    socket.on('disconnect', () => {
        console.log(`${socket.id} has disconnected`);
    });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    namespaces.forEach(namespace => {
		//namespace socket connection
        io.of(namespace.endpoint).on('connection', (socket) => {
			//The ackCallBack parameter is a confirmation callback function sent by the client, 
			//which the server can invoke to send an acknowledgment message back to the client.			
			socket.on('joinRoom', async(roomObj, ackCallBack) => {
				// Add the socket to the specified room.
				const thisNS = namespaces[roomObj.namespaceId];
				const thisRoomObj = thisNS.rooms.find(room=>room.roomTitle === roomObj.roomTitle);
				/*
				const thisRoomsHistory = '';
				if(roomObj.privateRoom === false){
					thisRoomsHistory = thisRoomObj.history;
				}
				*/
				thisRoomsHistory = thisRoomObj.history;


				socket.join(roomObj.roomTitle);

				/*
				if(roomObj.userNumbers >= 2 && roomObj.privateRoom === true){
					socket.emit("fullInfo", {
						info: `Sorry, you can't join the room. This room have already included 2 users`
					})
				}
				else{
					socket.join(roomObj.roomTitle);
				}*/
				
				console.log("after join", socket.rooms);
				// Fetch all sockets in the room within the namespace.
				const sockets = await io.of(namespace.endpoint).in(roomObj.roomTitle).fetchSockets();
				const socketCount = sockets.length;
				ackCallBack({
					numberOfUsers: socketCount,
					thisRoomsHistory
				});
				io.of(namespace.endpoint).in(roomObj.roomTitle).emit('updateUserCount', {
					message: `User "${roomObj.userName}" has joined the room`,
					socketCount: socketCount
				});
			})

			socket.on('leaveRoom', async (roomObj) => {
				socket.leave(roomObj.roomTitle);
				const sockets = await io.of(namespace.endpoint).in(roomObj.roomTitle).fetchSockets();
				const socketCount = sockets.length;
				socket.to(roomObj.roomTitle).emit('updateUserCount', {
					message: `User "${roomObj.userName}" has left the room`,
					socketCount: socketCount
				});

				/*
				const rooms = socket.rooms;
				let i = 0;
				rooms.forEach((room)=>{
					if(i!=0){
						socket.leave(room);
						console.log("room", room);
					}
					i++;
				})*/
			})
			

			// Listen for new messages from the client
			socket.on('newMessageToServer', (msg) => {
				//msg is the new message sent by the client
				const rooms = socket.rooms;
				console.log(rooms);
				const currentRoom = [...rooms][1];
				//emit new message to all clients
				//io.emit('newMessageToClients', msg);
				console.log("namespace:", namespace.endpoint, "currentroom:", currentRoom);
				io.of(namespace.endpoint).in(currentRoom).emit('newMessageToClients', msg);
				const thisNS = namespaces[msg.id];
				const thisRoom = thisNS.rooms.find(room=>room.roomTitle === currentRoom);
				console.log('thisroom:', thisRoom);
				thisRoom.addMessage(msg);
			});
        })
    })
})