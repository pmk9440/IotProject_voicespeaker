const uuid = require('uuid').v4
const _ = require('lodash')
const { DOMAIN } = require('../config')
const mqtt = require('mqtt');

var weatherInfo;

const option = {
  host : 'Broker IP',
  port : 1883,
  protocal : 'mqtt',
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

class Directive {
  constructor({namespace, name, payload}) {
    this.header = {
      messageId: uuid(),
      namespace: namespace,
      name: name,
    }
    this.payload = payload
  }
}

function resultText({midText, sum, diceCount}) {
  if (diceCount == 1) {
    return `결과는 ${sum}입니다.`
  } else if (diceCount < 4) {
    return `결과는 ${midText} 이며 합은 ${sum} 입니다.`
  } else {
    return `주사위 ${diceCount}개의 합은 ${sum} 입니다.`
  }
}

function throwDice(diceCount) {
  const results = []
  let midText = ''
  let resultText = ''
  let sum = 0
  console.log(`throw ${diceCount} times`)
  for (let i = 0; i < diceCount; i++) {
    const rand = Math.floor(Math.random() * 6) + 1
    console.log(`${i + 1} time: ${rand}`)
    results.push(rand)
    sum += rand
    midText += `${rand}, `
  }

  midText = midText.replace(/, $/, '')
  return {midText, sum, diceCount}
}

class CEKRequest {
  constructor (httpReq) {
    this.request = httpReq.body.request
    this.context = httpReq.body.context
    this.session = httpReq.body.session
    console.log(`CEK Request: ${JSON.stringify(this.context)}, ${JSON.stringify(this.session)}`)
  }

  do(cekResponse) {
    switch (this.request.type) {
      case 'LaunchRequest':
        client.publish("reqWeather", "onInfo");
        getWeatherInfo(cekResponse);
        return this.launchRequest(cekResponse)
      case 'IntentRequest':
        return this.intentRequest(cekResponse)
      case 'SessionEndedRequest':
        return this.sessionEndedRequest(cekResponse)
    }
  }

  launchRequest(cekResponse) {
    console.log('launchRequest')
    cekResponse.setSimpleSpeechText('무엇을 도와드릴까요?')
    cekResponse.setMultiturn({
      intent: 'ThrowDiceIntent',
    })
  }

  intentRequest(cekResponse) {
    console.log('intentRequest')
    console.dir(this.request)
    const intent = this.request.intent.name
    const slots = this.request.intent.slots

    switch (intent) {
      case 'PhilipsOn':
        cekResponse.appendSpeechText(`조명을 키겠습니다.`)
        client.publish("philips", "on");
        break;
        
      case 'PhilipsOff':
        cekResponse.appendSpeechText(`조명을 끄겠습니다.`)
        client.publish("philips", "off");
        break;

      case 'WeatherInfo':
        cekResponse.appendSpeechText('오늘의 날씨는 ' + weatherInfo[1].toString() +' 이고, ' + weatherInfo[4].toString() + ' 입니다.');
        break;

      default:
        break;
    }

    if (this.session.new == false) {
      cekResponse.setMultiturn()
    }
  }

  sessionEndedRequest(cekResponse) {
    console.log('sessionEndedRequest')
    cekResponse.setSimpleSpeechText('주사위 놀이 익스텐션을 종료합니다.')
    cekResponse.clearMultiturn()
  }
}

async function getWeatherInfo(cekResponse) {
  client.subscribe("resWeatherInfo");

  client.on('message', (topic, message, packet) => {
    weatherInfo = message.toString().split(",");
  })
}

class CEKResponse {
  constructor () {
    console.log('CEKResponse constructor')
    this.response = {
      directives: [],
      shouldEndSession: true,
      outputSpeech: {},
      card: {},
    }
    this.version = '0.1.0'
    this.sessionAttributes = {}
  }

  setMultiturn(sessionAttributes) {
    this.response.shouldEndSession = false
    this.sessionAttributes = _.assign(this.sessionAttributes, sessionAttributes)
  }

  clearMultiturn() {
    this.response.shouldEndSession = true
    this.sessionAttributes = {}
  }

  setSimpleSpeechText(outputText) {
    this.response.outputSpeech = {
      type: 'SimpleSpeech',
      values: {
          type: 'PlainText',
          lang: 'ko',
          value: outputText,
      },
    }
  }

  appendSpeechText(outputText) {
    const outputSpeech = this.response.outputSpeech
    if (outputSpeech.type != 'SpeechList') {
      outputSpeech.type = 'SpeechList'
      outputSpeech.values = []
    }
    if (typeof(outputText) == 'string') {
      outputSpeech.values.push({
        type: 'PlainText',
        lang: 'ko',
        value: outputText,
      })
    } else {
      outputSpeech.values.push(outputText)
    }
  }
}

const clovaReq = function (httpReq, httpRes, next) {
  cekResponse = new CEKResponse()
  cekRequest = new CEKRequest(httpReq)
  cekRequest.do(cekResponse)
  console.log(`CEKResponse: ${JSON.stringify(cekResponse)}`)
  return httpRes.send(cekResponse)
};

module.exports = clovaReq;
