import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import styles from './Chat.module.css';

const socket = io('http://localhost:8001');

const Chat = (props) => {

    socket.on('connect', () => {
        console.log("Connected");
        socket.emit('clientConnect');
    })

    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {

        socket.on('newMessageToClients', (new_message) => {
            setMessages(messages => [...messages, new_message]);
        });

        socket.on('newFileToClients', (new_file) => {
            setMessages(messages => [...messages, { user: new_file.user, text: new_file.fileName, file: new_file.file }]);
        });

        return () => {
            socket.off('messageFromServer');
            socket.off('newMessageToClients');
        };
    }, []);

    const sendMessage = (e) => {
        e.preventDefault();
        if (userMessage.trim() && props.userName.trim()) {
			console.log("current nameapce: ", props.namespaceSocket.current[props.namespace.id]);
			props.namespaceSocket.current[props.namespace.id].emit('newMessageToServer', { 
				user: props.userName, 
				text: userMessage,
				date: Date.now(),
				id: props.namespace.id
			});
			setUserMessage('');
        }
    };

    const sendFile = (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const fileData = ev.target.result;
                socket.emit('newFileToServer', { user: props.userName, file: fileData, fileName: file.name });
            };
            reader.readAsDataURL(file);
        }
    };
  

    return (
		<div className={styles.chat_container}>
			<h1>Welcome to Chat Room "{props.room}"! Your username is {props.userName}</h1>
			<p>There are {props.user} people in this room now</p>
			<div>{props.systemMessage}</div>
			<ul className={styles.chat_messages}>
				{props.messages && props.messages.map((message, index) => (
					<li key={index}>
						<div>
							<strong>{message.user+ " "}{new Date(message.date).toLocaleString()}</strong>
							<p>{message.text}</p>
						</div>
						{/*message.file && (
							<img src={message.file} alt={message.text} />
						)*/}
					</li>
				))}
				{/* This empty div is the scroll target; when new messages are added, the list scrolls to this point. */}
				<div ref={messagesEndRef} />
			</ul>
			<form onSubmit={sendMessage} className={styles.chat_form}>
				<input
					type="text"
					value={userMessage}
					onChange={(e) => setUserMessage(e.target.value)}
				/>
				{/*<input type="file" onChange={sendFile} />*/}
				<button type="submit">Send</button>
			</form>
		</div>
    );
};

export default Chat;
