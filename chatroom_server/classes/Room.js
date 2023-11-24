class Room{
    constructor(roomID, roomTitle, namespaceID, privateRoom){
        this.roomID = roomID;
        this.roomTitle = roomTitle;
        this.namespaceID = namespaceID;
        this.privateRoom = privateRoom;
        this.history = [];
    }

    addMessage(message){
        this.history.push(message);
    }

    clearHistory(){
        this.history = [];
    }
}

module.exports = Room;