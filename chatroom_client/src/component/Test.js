import React, { useState, useEffect, useRef } from 'react';
import styles from './Test.module.css';
import Chat from './Chat';
import io from 'socket.io-client';

const Test = () => {
	const [userName, setUserName] = useState('');
    const [state, setState] = useState(false);
	const [ifChooseNamespace, setIfChooseNamespace] = useState(false);
	const [ifChooseRoom, setIfChooseRoom] = useState(false);
    const [namespaces, setNamespaces] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [currentNamespace, setCurrentNamespace] = useState(null);
    const [currentRoom, setCurrentRoom] = useState('');
	const [userNumbers, setUserNumbers] = useState(1);
	const [messages, setMessages] = useState([]);
	const [systemMessage, setSystemMessage] = useState('');
    const namespaceSockets = useRef({});
    const listeners = useRef({
        nsChange: {},
		messageToRoom: {}
    });

	function userNameHandler(e){
        e.preventDefault();
        setState(true);
    }



    useEffect(() => {
        const mainSocket = io('http://localhost:8001');

        mainSocket.on('nameSpacesList', (data) => {
            setNamespaces(data);
        });

        return () => {
            mainSocket.disconnect();
        };
    }, []);
	

    useEffect(() => {
        if (currentNamespace) {
            const nsSocket = io(`http://localhost:8001${currentNamespace.endpoint}`);
            addListeners(currentNamespace.id, nsSocket);
            namespaceSockets.current[currentNamespace.id] = nsSocket;

            return () => {
                //nsSocket.disconnect();
            };
        }
    }, [currentNamespace]);

	useEffect(() => {
		console.log("curret2", currentRoom);
		if (currentRoom && currentNamespace) {
			const nsSocket = namespaceSockets.current[currentNamespace.id];
	
			nsSocket.on('updateUserCount', (data) => {
				setUserNumbers(data.socketCount);
				setSystemMessage(data.message);
			});
	
			return () => {
				nsSocket.off('updateUserCount');
			};
		}
	}, [currentRoom, currentNamespace]);
	
    const addListeners = (id, nsSocket) => {
		console.log("check here:", nsSocket);
        if (!listeners.current.nsChange[id]){
			console.log("check here:", nsSocket);
            listeners.current.nsChange[id] = true;
        }

		if(!listeners.current.messageToRoom[id]){
			nsSocket.on('newMessageToClients', (message) => {
				console.log("new", message);
				setMessages(messages => [...messages, message]);
			});
			listeners.current.messageToRoom[id] = true;
		}
    };

    const namespacesClickHandler = (ns) => {
		setIfChooseNamespace(true);
		if(currentNamespace && currentRoom)
		{
			const nsSocket = namespaceSockets.current[currentNamespace.id];
			nsSocket.emitWithAck('leaveRoom', 
			{ 
				roomTitle: currentRoom, 
				namespaceId: currentNamespace.id, 
				userName: userName,
			});
		}
        setCurrentNamespace(ns);
        setRooms(ns.rooms);
		setCurrentRoom('');
		setIfChooseRoom(false);
    };

    const roomClickHandler = async(room) => {
		setIfChooseRoom(true);
		console.log("curret1", currentRoom);
		const nsSocket = namespaceSockets.current[currentNamespace.id];
		if (currentRoom && currentRoom !== room.roomTitle) {
			nsSocket.emitWithAck('leaveRoom', 
			{ 
				roomTitle: currentRoom, 
				namespaceId: currentNamespace.id, 
				userName: userName,
			});
		}

        setCurrentRoom(room.roomTitle);
		const ackResponse = await nsSocket.emitWithAck('joinRoom', 
			{ 
				roomTitle: room.roomTitle, 
				namespaceId: currentNamespace.id, 
				userName: userName,
				privateRoom: room.privateRoom,
				userNumbers: userNumbers
			}
		);
		nsSocket.on("fullInfo", data => {
			console.log(data.info);
		})
		setUserNumbers(ackResponse.numberOfUsers);  
		setMessages(ackResponse.thisRoomsHistory);
    };

    return (
		<div>
			{!state ? 
				(
					<div className={styles.username}>
						<form onSubmit={userNameHandler}>
							<label>Please input your user name for the chatroom</label>
							<input 
								type="text" 
								value={userName}
								onChange={(e) => setUserName(e.target.value)}
							/>
							<button type="submit" ><b>Create</b></button>
						</form>
					</div>
				)
				:
				(
					<div className={styles.appContainer}>
						<div className={styles.namespaceSidebar}>
							{namespaces.map(ns => (
								<div
									key={ns.id}
									onClick={() => namespacesClickHandler(ns)}
									className={styles.IconContainer}>
									<img src={ns.image} alt={ns.name} className={styles.serverIcon} />
								</div>
							))}
						</div>
						<div className={styles.channelsSidebar}>
							<div className={styles.serverName}>{currentNamespace?.name}</div>
							<ul className={styles.channelList}>
								{rooms.map(room => (
									<li
										key={room.roomID}
										onClick={() => roomClickHandler(room)}
										className={`${styles.channel} ${room.privateRoom ? styles.channelPrivate : styles.channelGlobal} ${currentRoom === room.roomTitle ? styles.activeRoom : ''}`}>
										{room.privateRoom ? <i className="fas fa-lock"></i> : <i className="fas fa-globe"></i>} #{room.roomTitle}
									</li>
								))}
							</ul>
						</div>
						{ifChooseNamespace && ifChooseRoom ?
							(
								<div className={styles.chatContainer} >
									<Chat room={currentRoom} user={userNumbers} userName={userName} namespaceSocket={namespaceSockets} namespace={currentNamespace}  messages={messages} systemMessage={systemMessage} />
								</div>
							)
						:
							(
								<div className={styles.choice}>
									<b>Please choose the namespace and room.</b>
								</div>
							)
						}
					</div>
				)
			}
		</div>
    );
};

export default Test;


