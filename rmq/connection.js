const rmq_config = require('../setup/rmq.json');
const configs=require('../setup/configs.json');
let rmq = require('amqplib');
let request = require('request');
let absensiModel = require('../model/absensi_model');
const app = require('../app');
const moment = require('moment');
let io = app.io;
let connection2;

/** connect to rabbit**/
connect = async() => {
    try {
        let connection = await rmq.connect(rmq_config.broker_uri);
        connection2=await rmq.connect(rmq_config.broker_uri2);
        connection2.on("error",function(e) { log(e);  });
        await consume(connection);
        await consume2(connection2);
    }catch (er){
        console.log(err);
    }
};


/** consume to incoming msg**/
consume = async (connection) => {
    try {
        let channel = await connection.createChannel();
        await channel.assertExchange(rmq_config.exchange_name, 'topic', {durable : true});
        let q = await channel.assertQueue(rmq_config.service_queue_name, {exclusive : false});
        await channel.bindQueue(q.queue, rmq_config.exchange_name, rmq_config.service_route);
        channel.consume(q.queue, (msg) => {
            console.log("=================================================");
            console.log("Incoming msg : "+msg.content.toString());
            console.log(msg.fields.routingKey)
            if(msg.fields.routingKey === rmq_config.route_update_absensi){
               try {
                   let query = JSON.parse(msg.content.toString());
                   if(query.tipe!==undefined&&query.tipe===0){
                       console.log("data pengujian berhasil diambil");
                       console.log("memproses data pengujian "+query.tag+" antrian ke "+ query.antrian+" Start Time : " +query.starttime);
                       masukanDataPengujian(query)
                   }else {
                       console.log("-------------------------------------------------");
                       console.log('Insert Absensi');
                       console.log("-------------------------------------------------");
                       request({
                           url: configs.URL_SERVICE+'absensi/insert',
                           method: "POST",
                           json: true,
                           body: query
                       }, function (error, response, body){
                           console.log(body);
                       });
                   }

               }catch (err){
                   console.log(err);
               }
            }
        }, {noAck: true});
        console.log("Service consume on : "+rmq_config.service_route);
    }catch(err) {
        console.log(err);
    }
};
/** consume to incoming msg**/
consume2 = async (connection) => {
    try {
        let channel = await connection.createChannel();
        await channel.assertExchange(rmq_config.exchange_name, 'topic', {durable : true});
        let q = await channel.assertQueue(rmq_config.service_queue_name, {exclusive : false});
        await channel.bindQueue(q.queue, rmq_config.exchange_name, rmq_config.service_route);
        channel.consume(q.queue, (msg) => {
         /*   console.log("=================================================");
            console.log("Incoming msg : "+msg.content.toString());
            console.log(msg.fields.routingKey)*/
            if(msg.fields.routingKey === rmq_config.route_update_absensi){
               try {
                   let query = JSON.parse(msg.content.toString());
                   if(query.tipe!==undefined&&query.tipe===0){
                       //console.log("data pengujian berhasil diambil");
                       let timeAfterQueue = new Date().getTime();
                       query.timeinqueue= (timeAfterQueue-query.starttime)/1000;
                      // console.log("memproses data pengujian "+query.tag+", antrian ke "+ query.antrian+", Start Time : " +query.starttime+", Time in Queue : "+query.timeinqueue);
                       masukanDataPengujian(query)
                   }else {
                       console.log("-------------------------------------------------");
                       console.log('Insert Absensi');
                       console.log("-------------------------------------------------");
                       request({
                           url: configs.URL_SERVICE+'absensi/insert',
                           method: "POST",
                           json: true,
                           body: query
                       }, function (error, response, body){
                           console.log(body);
                       });
                   }

               }catch (err){
                   console.log(err);
               }
            }
        }, {noAck: true});
        console.log("Service consume on : "+rmq_config.service_route);
    }catch(err) {
        console.log(err);
    }
};

 masukanDataPengujian=async (query)=> {
    try {
        let timeBeforeInsertToDatabase=new Date().getTime();
       await absensiModel.insertPengujian(query.tag,query.antrian,query.starttime,query.timeinqueue);
       let timeAfterSaveToDb=new Date().getTime();
       let timeForInsertToDatabase=(timeAfterSaveToDb-timeBeforeInsertToDatabase)/1000;
       let proccessTime=(timeAfterSaveToDb-query.starttime)/1000;
       io.emit('status', query.tag+" success saving data "+query.antrian+" to database"+", Proccess Time : " +proccessTime+", Time in Queue : "+query.timeinqueue+", Time For Saving to DB : "+timeForInsertToDatabase);
       absensiModel.updateInsertToDbTime(query.tag,query.antrian,timeForInsertToDatabase,proccessTime);
    }catch(err) {
        console.log(err);
    }
};

module.exports = {
    connect:connect
};