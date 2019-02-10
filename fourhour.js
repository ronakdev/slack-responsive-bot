const request = require('request')
const config = require('./config.js')
const fs = require('fs')
const message = require('./message.js')

// constants
const maxTime = (process.argv.length == 3) ? parseInt(process.argv[2]) : 4*60*60*1000 // 4 hours
// Made it allow cmdline args so I could experiment
const duration = 30*60*1000 // 30 Minutes
const jsonLocation = `unreadlogs-${Math.random().toString(36).substring(7)}.json`

console.log(`Saving Data to ${jsonLocation}`)

let logData = {}

/**
 * Main Function; This looks at each im and logs if neeeded
 */
function cycle() {
	// get all ims to look at
	console.log(`Cycling @ ${new Date()}`)
	getIMList().then((imChannelIds) => {
		for (let index in imChannelIds) {
			let id = imChannelIds[index]
			log(id)
		}
	})
}

/**
 * Logs if there hasn't been a response in 4 hours
 * 
 * @param {string} imId The id of the IM Channel
 */
async function log(imId) {
	request(`https://slack.com/api/conversations.info?token=${config.token}&channel=${imId}&pretty=1`,
	async (err, response, body) => {
		if (!err, response.statusCode == "200") {
			console.log(`Checking out ${imId}`)
			let data = JSON.parse(response.body)
			if (data.channel.latest) {
				let msgData = data.channel.latest

				console.log(`Data: Unreads: ${data.channel.unread_count}`)
				if (data.channel.unread_count > 1) {
					msgData = await getLatestMessage(data.channel.id, data.channel.unread_count)
				}
				let msgId = msgData.client_msg_id
				let time = Date.now()/1000 - parseFloat(msgData.ts)
				console.log(`It's been ${time}, maxTime is ${maxTime}`)
				if (time < maxTime) {return}
				console.log("past?")
				let firstPing = false
				firstPing = (!logData[data.channel.id] || !logData[data.channel.id][msgId])
				if (!logData[data.channel.id]) {
					logData[data.channel.id] = {}
				}
				logData[data.channel.id][msgId] = {
					responseTime: time,
					userId: data.channel.user,
					lastMessageUser: data.channel.latest.user,
					timeMessageWasSent: msgData.ts
				}
				if (firstPing) {
					logData[data.channel.id][msgId][firstPing] = Date.now() // so we can make our histogram
				}
				// message user
				updateJSON()
				message(data.channel.user, `Reply to channel #${data.channel.id}!`, config.token)
			} else {
				// ignore this, this shouldn't happen
			}
			
		}
	})
}

/**
 * Writes Log Data to a JSON File
 */
function updateJSON() {
	fs.writeFile(jsonLocation, JSON.stringify(logData), (err) => {
		if (err) console.err(err)
	})
}

/**
 * Gets the message X messages from now in a specific channel
 * 
 * @param {string} channel 
 * @param {number} unreads 
 */
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

/**
 * Gets a list of all the IM Conversations
 */
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

/**
 * Start the function
 */
cycle()
setInterval(cycle, duration)