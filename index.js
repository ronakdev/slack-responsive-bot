const config = require('./config.js')
const request = require('request')
const fs = require('fs')

const minutes = 60*1000

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

function logUnreads(imId, csvPath) {
	request(`https://slack.com/api/conversations.info?token=${config.token}&channel=${imId}&pretty=1`,
	(err, response, body) => {
		if (!err, response.statusCode == "200") {
			let data = JSON.parse(response.body)
			console.log(data.channel.unread_count)
			fs.appendFile(csvPath, `${data.channel.user},${data.channel.unread_count},${new Date()}\n`, function (err) {
				if (err) throw err;
			});
		}
	})
}

function cycle() {
	getIMList().then((imIds) => {
		for (let index in imIds) {
			logUnreads(imIds[index], "unreads.csv")
		}
	}).catch((err) => {
		console.log(err)
	})
}

setTimeout(cycle, 10*minutes)

