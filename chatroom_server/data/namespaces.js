const Namespace = require('../classes/Namespace');
const Room = require('../classes/Room');

const first = new Namespace(0, 'first', 'https://via.placeholder.com/150/0000FF/808080?text=1', '/first');
const second = new Namespace(1, 'second', 'https://via.placeholder.com/150/00FF00/808080?text=2', '/second');
const third = new Namespace(2, 'third', 'https://via.placeholder.com/150/FF0000/FFFFFF?text=3', '/third');

first.addRoom(new Room(0, 'room1', 0, false));
first.addRoom(new Room(1, 'room2', 0, false));
first.addRoom(new Room(2, 'room3', 0, false));

second.addRoom(new Room(3, '2room1', 1, false));
second.addRoom(new Room(4, '2room2', 1, false));
second.addRoom(new Room(5, '2room3', 1, false));

third.addRoom(new Room(6, '3room1', 2, false));
third.addRoom(new Room(7, '3room2', 2, false));
third.addRoom(new Room(8, '3room3', 2, false));


const namespaces = [first, second, third];
module.exports = namespaces;