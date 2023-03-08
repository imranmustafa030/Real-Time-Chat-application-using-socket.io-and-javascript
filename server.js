const path = require('path');
const http = require('http')
const express = require('express');
const app = express();
const PORT =3000 || process.env.PORT;
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const formateMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');
const botName = 'ChatChord Bot';

//set static folder
app.use(express.static(path.join( __dirname, 'public')));

//run when client connects
io.on('connection', socket =>{

    socket.on('joinRoom', ({username, room})=>{

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

         //Welcome current user
         socket.emit('message', formateMessage(botName, 'Welocme to Chatcord!'));//to the user who is connecting

         //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formateMessage( botName, `${user.username} has joined a chat`));//send msg to users that connected except connecting users

        //Send user and room info
        io.to(user.room).emit('roomUsers',  {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });
    
    
    //Listen for chatMessage 
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);


        io.to(user.room).emit('message',formateMessage(user.username, msg));
    });
    
    //Runs when client disconnects
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formateMessage(botName, `${user.username} has left the chat`));//to all the sclienst in general
        }
            

    } );
})
 
server.listen ( PORT, ()=> console.log(`Server running on port ${PORT}`));