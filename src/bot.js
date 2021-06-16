require('dotenv').config();

// require the discord.js module
const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');
const ytdl = require('ytdl-core');
var timeIsBeing420 = new Date("08/09/2020 07:42:00 PM").getTime();

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code

// this event will only trigger one time after logging in
client.once('ready', ready => {
	console.log('Ready!');
    timeToPlay(ready);
});

// login to Discord with your app's token
client.login(process.env.token);

//Reads every message thats not from the bot to answer with basic responses.
client.on('message', message => {    
    if (message.author.bot) return;
    let bericht = message.content.toLowerCase();
    switch(bericht){
        case 'tik':
            message.channel.send('Tak!');
            break;
        case 'pif':
            message.channel.send('Paf!');
            break;
        case ('hoe laat is het?'):
            message.author.send("BONKO TIME");
            break;
        case ('kut bot'):
            //veranderd naam van verzender
            message.member.setNickname('Ik ben een loser');
            break;
    }
});

//notify's owner if message gets deleted
client.on('messageDelete', message =>{
    let notify = message.author.username + " heeft '" + message.content+ "' verwijderd." ;
    msg_wace(notify);
})

//als het 4:20 / 16:20 is joined de bot en zegt die BONKO TIME
function timeToPlay(guild) {
    var url ="https://www.youtube.com/watch?v=5QCaaAyz-yA&ab_channel=MovieManiacMovieManiac";
    if(timeIsBeing420 === currentTime){
        guild.channels.sort(function(chan1,chan2){
            if(chan1.type!==`text`) return 1;
            if(!chan1.permissionsFor(guild.me).has(`SEND_MESSAGES`)) return -1;
            return chan1.position < chan2.position ? -1 : 1;
        }).first().send(`?play ` + url);
    }
    var currentTime = new Date().getTime();
    var subtractMilliSecondsValue = timeIsBeing420 - currentTime;
    setTimeout(timeToPlay, subtractMilliSecondsValue);

    
    //juiste kanaal joinen + muziek afspelen

}


//given user-id and msg send that to person. 

function msg_person(id, msg){
    client.users.cache.get(id).send(msg);
}
//send owner a msg  
 function msg_wace(msg){
    client.users.cache.get('474661528524816386').send(msg);
}

const queue = new Map();

client.on("message", message => {
    if (!message.content.startsWith(prefix)) return;
  
    const serverQueue = queue.get(message.guild.id);
  
    if (message.content.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      return;
    } else {
      message.channel.send("You need to enter a valid command!");
    }
});
async function execute(message, serverQueue) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
        );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };

    if (!serverQueue) {
        const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
        } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}
function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
        "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
        "You have to be in a voice channel to stop the music!"
        );
        
    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");
        
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
