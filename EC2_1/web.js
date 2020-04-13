const mqtt = require('mqtt');
var http = require('http');
var fs = require('fs');
var express =  require('express');
var app = express();
var path = require('path');
var request = require('request');
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: 8000
  });

var weatherInfo;
var light_status = true;

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.get("/", function(req, res){
    res.writeHead(200,{"Content-Type":"text/html"});
    fs.createReadStream("./index.html").pipe(res); 
});

const option = {
    host : 'Broker IP',
    port : 1883,
    protocal : 'mqtt',
    username : 'philips',
    password : '0000'
}

wss.on("connection", function (ws) {
    var beforeLightStatus = true;
    console.log("웹소켓 시작");
    
    if (beforeLightStatus != light_status) {
        console.log("왔다ㅏㅏ");
        console.log(weatherInfo);
        ws.send(weatherInfo.toString());
        beforeLightStatus = light_status;
    }
    

    ws.on("message", function(message) {
        console.log("Received: %s", message);
    });
});

const client = mqtt.connect(option);

client.on("connect", () => {
    console.log("connected : "+ client.connected);
})

client.on("error", () => {
    console.log("Can't connect : " + error);
})

app.post("/on", function(req, res) {

    client.publish("philips", "on");
    res.redirect('/');
});

app.post("/off", function(req, res) {
  
    client.publish("philips", "off");
    res.redirect('/');
});

app.post("/weather", function(req, res) {

    client.publish("reqWeather", "on");
    console.log("weather");

    getWeather(res);

})

client.subscribe("resWeather");

async function getWeather(res) {

    console.log("getWeather");

    client.on('message', (topic, message, packet) => {
        weatherInfo = message.toString().split(",");
        var context = {weatherInfo : weatherInfo}
        console.log(weatherInfo);
        light_status = !light_status;
        console.log(light_status);
        res.render('../index.html', context);
    })
}

http.createServer(app).listen(8080);