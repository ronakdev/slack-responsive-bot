const request = require('request')
const config = require('./config.js')
const fs = require('fs')

const duration = 30*60*1000; // 30 Minutes
const jsonLocation = `unreadlogs-${Math.random().toString(36).substring(7)}.json`

console.log(`Saving Data to ${jsonLocation}`)
let logData = {}

function cycle() {
	// get all ims to look at
	getIMList().then((imChannelIds) => {
		for (let index in imChannelIds) {
			let id = imChannelIds[index]
			log(id)
		}
	})
}

async function log(imId) {
	request(`https://slack.com/api/conversations.info?token=${config.token}&channel=${imId}&pretty=1`,
	async (err, response, body) => {
		if (!err, response.statusCode == "200") {
			let data = JSON.parse(response.body)
			if (data.channel.latest) {
				let msgData = data.channel.latest
				/* TODO: Get Proper Msg Id If Unreads Are Not 1 */
				if (data.channel.unread_count > 1) {
					msgData = await getLatestMessage(data.channel.id, data.channel.unread_count)
				}
				let msgId = msgData.client_msg_id
				let time = Date.now()/1000 - parseFloat(msgData.ts)
				if (!logData[data.channel.id]) {
					logData[data.channel.id] = {}
				}
				logData[data.channel.id][msgId] = {
					responseTime: time,
					userId: data.channel.user,
					lastMessageUser: data.channel.latest.user
				}
				
				updateJSON()
			} else {
				// ignore this, this shouldn't happen
			}
			
		}
	})
}

function updateJSON() {
	fs.writeFile(jsonLocation, JSON.stringify(logData), (err) => {
		if (err) console.err(err)
	})
}

function getLatestMessage(channel, unreads) {
	return new Promise((resolve, reject) => {
		request(`https://slack.com/api/conversations.history?token=${config.token}&channel=${channel}&limit=${unreads}&pretty=1`,
		(err, response, body) => {
			if (!err, response.statusCode == "200") {
				let data = JSON.parse(response.body)
				resolve(data.messages.pop())
			} else {
				reject(err)
			}
		})
	})
}

function getIMList() {
	return new Promise((resolve, reject) => {
		request(`https://slack.com/api/conversations.list?token=${config.token}&types=im&pretty=1`, 
		(err, response, body) => {
			if (!err && response.statusCode == "200") {
				let data = JSON.parse(response.body)
				let imIds = []
				for (let imIndex in data.channels) {
					let im = data.channels[imIndex]
					imIds.push(im.id)
				}
				resolve(imIds)
			} else {
				reject(err)
			}
		})	
	})
}

cycle()
setInterval(cycle, duration)