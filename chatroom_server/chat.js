// Import necessary modules
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');

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
				thisRoomsHistory = thisRoomObj.history;


				socket.join(roomObj.roomTitle);
				
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
			})
			

			// Listen for new messages from the client
			socket.on('newMessageToServer', (msg) => {
				//msg is the new message sent by the client
				const rooms = socket.rooms;
				console.log(rooms);
				const currentRoom = [...rooms][1];
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