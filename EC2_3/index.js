var request = require('request');
const mqtt= require('mqtt');

const option = {
    host : 'Broker IP',
    port : 1883,
    protocol : 'mqtt',
    username : 'philips',
    password : '0000'
}

const client = mqtt.connect(option);

client.on("connect", () => {
    console.log("subConnected : "+ client.connected);
})

client.on("error", () => {
    console.log("Can't connect Sub : " + error);
})

client.subscribe("reqWeather");

client.on('message', (topic, message, packet) => {
    console.log("on")
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth();
    var d = date.getDate();
    var hour = date.getHours() + 9;
    var minute = date.getMinutes();
    var weatherInfo;

    console.log(hour);

    if ((m+1)<10) {
        m = "0" + (m+1).toString();
    }

    if (d<10) {
        d = "0" + d.toString();
    }
        
    if (hour > 24) {
        hour -= 24;
    }

    var hm;

    if (hour >= 0 && hour < 5) {
        hour = "오전 5시 이후에 해주세요.";
        hm = hour;
    }
    else if (hour >=5 && hour < 8) {
        hour = "05";
    }
    else if (hour >=8 && hour < 11) {
        hour = "08";
    }
    else if (hour >=11 && hour < 14) {
        hour = "11";
    }
    else if (hour >=14 && hour < 17) {
        hour = "14";
    }
    else if (hour >=17 && hour < 20) {
        hour = "17";
    }
    else if (hour >=20) {
        hour = "23";
    }

    hm = hour + "00";

    var ymd = y.toString() + m.toString() + d.toString();

    console.log(date.toString());
    console.log(ymd);
    console.log(hm);

    var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=서비스 키 입력'; /* Service Key*/
    queryParams += '&' + encodeURIComponent('ServiceKey') + '=' + encodeURIComponent('-'); /* 공공데이터포털에서 받은 인증키 */
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* 페이지번호 */
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* 한 페이지 결과 수 */
    queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('JSON'); /* 요청자료형식(XML/JSON)Default: XML */
    queryParams += '&' + encodeURIComponent('base_date') + '=' + encodeURIComponent(ymd); /* 15년 12월 1일발표 */
    queryParams += '&' + encodeURIComponent('base_time') + '=' + encodeURIComponent(hm); /* 05시 발표 */
    queryParams += '&' + encodeURIComponent('nx') + '=' + encodeURIComponent('61'); /* 예보지점 X 좌표값 */
    queryParams += '&' + encodeURIComponent('ny') + '=' + encodeURIComponent('120'); /* 예보지점의 Y 좌표값 */

    if (message == "on") {
        request({
            url: url + queryParams,
            method: 'GET'
        }, function (error, response, body) {
            
            let data = JSON.parse(body);
    
            console.log(data);
            
            var water = data.response.body.items.item[0].fcstValue + "%";
            var water_type = data.response.body.items.item[1].fcstValue;
            var humidity = data.response.body.items.item[2].fcstValue + "%";
            var sky = data.response.body.items.item[3].fcstValue;
            var temperature = data.response.body.items.item[4].fcstValue + "°C";
            
            if (water_type == "0") {
                water_type = "해쨍쨍";
            }
            else if (water_type == "1") {
                water_type = "비";
            }
            else if (water_type == "2") {
                water_type = "비/눈";
            }
            else if (water_type == "3") {
                water_type = "눈";
            }
            else if (water_type == "4") {
                water_type = "소나기";
            }
            
            if (sky === "1") {
                sky = "구름없음";
            }
            else if (sky === "3") {
                sky = "구름많음";
            }
            else if (sky === "4") {
                sky = "흐림";
            }
            
            weatherInfo = [water, water_type, humidity, sky, temperature, hour];
            
            console.log("front에 보냄");
            console.log(weatherInfo.toString());
            client.publish("resWeather", weatherInfo.toString());
        });
    }
    else if (message == "onInfo") {
        request({
            url: url + queryParams,
            method: 'GET'
        }, function (error, response, body) {
            
            let data = JSON.parse(body);
    
            console.log(data);
            
            var water = data.response.body.items.item[0].fcstValue + "%";
            var water_type = data.response.body.items.item[1].fcstValue;
            var humidity = data.response.body.items.item[2].fcstValue + "%";
            var sky = data.response.body.items.item[3].fcstValue;
            var temperature = data.response.body.items.item[4].fcstValue + "°C";
            
            if (water_type == "0") {
                water_type = "해쨍쨍";
            }
            else if (water_type == "1") {
                water_type = "비";
            }
            else if (water_type == "2") {
                water_type = "비/눈";
            }
            else if (water_type == "3") {
                water_type = "눈";
            }
            else if (water_type == "4") {
                water_type = "소나기";
            }
            
            if (sky === "1") {
                sky = "구름없음";
            }
            else if (sky === "3") {
                sky = "구름많음";
            }
            else if (sky === "4") {
                sky = "흐림";
            }
            
            weatherInfo = [water, water_type, humidity, sky, temperature, hour];

            console.log("clova에 보냄");
            client.publish("resWeatherInfo", weatherInfo.toString());
        });
    }
})



