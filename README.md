# Overview

`fourhour.js` contains the code most worked on. In its current state, it produces JSON periodically (updating the same file) detailing what users have exceeded a specific time (4 hours in our use case).

Additionally, it sends a slack message to the user every ping if they have not responded to someone after 4 hours. I didn't make it send only one time, but to implement that would just mean that I'd just have to add an if statement.

It's been working in my local tests, although it's been kinda weird to test it with essentially messaging myself :P .

## Permissions the slack app will need:

channels:read -> required to get a list of ims (I'm a bit concerned by how this will work (given its current implementation, in a larger organization))
chat:write:bot -> required to send messages
im:history -> required to figure out the last unread message. No personal data / messages are read, only their timestamps / ids
bot -> required to have a bot user

## Starting the app

	node fourhour.js

will make it run by default, make sure to `npm install` if you just cloned it.

## What it outputs / Next Steps

JSON Data, some next steps would involve using the data we produce to create csv data. Essentially, instead of storing the json data, we could store a CSV file that stores the total unreads by user (conversation.info) and the current ping time.