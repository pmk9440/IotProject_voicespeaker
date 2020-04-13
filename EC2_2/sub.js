const mqtt= require('mqtt');
var request = require('request');

const option = {
    host : 'Broker IP',
    port : 1883,
    protocol : 'mqtt',
    username : 'philips',
    password : '0000'
}

const client = mqtt.connect(option);

client.on("connect", () => {
    console.log("connected : "+ client.connected);
})

client.on("error", () => {
    console.log("Can't connect : " + error);
})

client.subscribe("philips");

client.on('message', (topic, message, packet) => {
    if (message == "on") {
        console.log("on")
        request({   
            url: 'http://',    //1번 그룹 주소 작성 / 전등 제어
            method: 'PUT',
            body: JSON.stringify({"on":true})  //on : ture 켜기, on : false 끄기
        })
    }
    else if (message == "off") {
        console.log("off")
        request({   
            url: 'http://',    //1번 그룹 주소 작성 / 전등 제어
            method: 'PUT',
            body: JSON.stringify({"on":false})  //on : ture 켜기, on : false 끄기
        })
    }
})