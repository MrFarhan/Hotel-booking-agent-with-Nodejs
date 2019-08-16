const functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp();
var firestore = admin.firestore();

const { WebhookClient } = require('dialogflow-fulfillment');
process.env.DEBUG = "dialogflow:debug"

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const _agent = new WebhookClient({ request, response });

    // let params = agent.parameters;

    function bookRooms(agent) {
        return firestore.collection('orders').add(agent.parameters)
            .then(() => {
                return agent.add(`${agent.parameters['Name']} your hotel booking request for ${agent.parameters["Type"]} room for 
                ${ agent.parameters['Person']} person(s) is forwarded to booking department, we will contact you on ${agent.parameters['Email']} soon. `)
            })

            .catch((e => {
                console.log("error is", e)
                agent.add('Error')
            }))

    }

    async function showBookings(agent) {
        return await firestore.collection('orders').get(agent.parameters)
            .then((querySnapShot) => {
                var orders = [];
                querySnapShot.forEach((doc) => {
                    orders.push(doc.data())
                });
                return agent.add(`You have ${orders.length} orders; Do you want to see them ? `)
            })

    }

    async function showBookingsYes(agent) {
        return await firestore.collection('orders').get(agent.parameters)
            .then((querySnapShot) => {
                var showOrders = [];
                querySnapShot.forEach((doc) => {
                    showOrders.push(doc.data())
                });
                var followSpeech = [];
                showOrders.forEach((eachOrder, index) => {
                    followSpeech += ` Order no ${index + 1} is ${eachOrder['Type']} room for ${eachOrder['Person']} person(s) booked by ${eachOrder['Name']} \n.`;
                })
                return agent.add(followSpeech)
            })
    }

    function welcome(agent) {
        agent.add("Hi! I am your hotel booking Agent. Shall i book a room for you ? or show your existing bookings ? or ask me to lodge a complain or write a suggestion ?")
        return
    }

    let intents = new Map();

    intents.set("Default Welcome Intent", welcome);
    intents.set("Book Rooms", bookRooms);
    intents.set("Show Bookings", showBookings);
    intents.set("Show Bookings - yes", showBookingsYes);


    _agent.handleRequest(intents);
});


