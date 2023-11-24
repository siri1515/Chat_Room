import React, { useState, useEffect, useRef } from 'react';
import styles from './Test.module.css';
import Chat from './Chat';
import io from 'socket.io-client';

const socket = io('http://localhost:8001');


const Test1 = () => {

	//namespace
	const [namespaces, setNamespaces] = useState([]);
	const [rooms, setRooms] = useState([]);
	const [currentNamespace, setCurrentNamespace] = useState('');
	const [currentRoom, setCurrentRoom] = useState('');
	const [namespaceSockets, setNamespaceSockets] = useState({});
	//const [socketID, setSocketID] = useState([]);
	const socketID = [];
	const listeners = {
		nsChange: []
	}

	const addListeners = (id) => {
		if (!listeners.nsChange[id]) {
			socketID[id].on('nsChange', (data) => {
				console.log("namespace changed!");
				console.log(data);
			})
			listeners.nsChange[id] = true;
		}
	}

	socket.on('nameSpacesList', (data) => {
		console.log(data);
		setNamespaces(data);
	})

	function namespacesClickHandler(ns) {
		setCurrentNamespace(ns);

		let thisNS = socketID[ns.id];
		if (!socketID[ns.id]) {
			socketID[ns.id] = io(`http://localhost:8001${ns.endpoint}`);
		}

		/*
		if (namespaceSocket) {
			namespaceSocket.disconnect();
		}
		//const newSocket = io(`http://localhost:8001${ns.endpoint}`);

		/*
		newSocket.on('name_space_change', (data) => {
			console.log("namespace changed!");
			console.log(data);
		})
		setNamespaceSocket(newSocket);*/
		addListeners(ns.id)
		setRooms(ns.rooms);
	}

	function roomClickHandler(room){
		setCurrentRoom(room);
		console.log("someone click on ", room); 
		socketID[currentNamespace.id].emit('joinRoom', room.roomTitle);
	}

  	return (
		<div className={styles.appContainer}>
			<div className={styles.serversSidebar}>
				{namespaces.map(ns => (
					<div
						key={ns.name}
						ns={ns.endpoint}
						className={styles.serverIconContainer}
						onClick={() => namespacesClickHandler(ns)}
					>
						<img src={ns.image} alt={ns.name} className={styles.serverIcon} />
					</div>
				))}
			</div>
			<div className={styles.channelsSidebar}>
				<div className={styles.serverName}>{currentNamespace.name}</div>
				<ul className={styles.channelList}>
					{rooms.map(room => (
						<li
							key={room.roomID}
							className={`${styles.channel} ${room.privateRoom ? styles.channelPrivate : styles.channelGlobal}`}
							onClick={() => roomClickHandler(room)}
						>
							{room.privateRoom ? <i className="fas fa-lock"></i> : <i className="fas fa-globe"></i>} #{room.roomTitle}
						</li>
					))}
				</ul>
			</div>
			<div className={styles.chatContainer}>
				<Chat />
			</div>
		</div>
  	);
};

export default Test1;