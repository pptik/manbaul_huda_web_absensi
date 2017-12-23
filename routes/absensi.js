const express = require('express');
const router = express.Router();
const userModel = require('../model/user_model');
const absensiModel = require('../model/absensi_model');
let bcyrpt=require('bcrypt-nodejs');
const moment = require('moment');
let id = require('moment/locale/id');

router.get('/list/mac', async(req, res) => {
    try{
        let listMacList=await absensiModel.getListAllMac();
        res.status(200).send({success: true, message: "Data Berhasil Diambil",listmac:listMacList});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});
router.get('/list/pengujian', async(req, res) => {
    try{
        let listPengujian=await absensiModel.getListPengujian();
        res.status(200).send({success: true, message: "Data Berhasil Diambil",listpengujian:listPengujian});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});
router.post('/list/absen/by/mac', async(req, res) => {
    try{
        let listabsen=await absensiModel.getListAbsenByMacID(req.body.MacID);
        res.status(200).send({success: true, message: "Data Berhasil Diambil",list:listabsen});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});
router.post('/list/absen/by/mac/starttime/endtime', async(req, res) => {
    let query=req.body;
    console.log(query)
    try{
        let listabsen=await absensiModel.getListAbsenByMacIDStartEndTime(query.MacID,query.StartTime,query.EndTime);
        res.status(200).send({success: true, message: "Data Berhasil Diambil",list:listabsen});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});
router.post('/insert', async(req, res) => {
    let query=req.body;
    if (query.mac===undefined||query.rf_id===undefined)res.status(200).send({success: false, message: "Parameter tidak Lengkap"});
    else {
        try{
            let MacInCollection= await absensiModel.findMacByMacID(query.mac);
            let today=moment(new Date());
            query.date=new Date(moment().format('YYYY-MM-DD HH:mm:ss'));
            query.tanggal=today.format("dddd, DD/MM/YYYY",'id');
            query.waktu=today.format("HH:mm:ss");
            let dataUser=await absensiModel.promiseGetDetailUser(query.rf_id);
            if(MacInCollection.length>0){
               if(dataUser){
                   if(dataUser.RoleID===0){
                       if(MacInCollection[0].status===0){
                           await absensiModel.updateStatusDeviceByMac(query.mac,1);
                       }else {
                           await absensiModel.updateStatusDeviceByMac(query.mac,0);
                       }
                   }else {
                       if(MacInCollection[0].status===0){
                           await absensiModel.insertAbsensi(query);
                           query.macDetail=await absensiModel.promiseGetDetailMacID(query.mac);
                           query.detailUser=dataUser;
                           req.app.io.emit('absensi', query);
                           res.status(200).send({success: true, message: "Data Berhasil Dikirim"});
                       }
                   }
               }
            }else {
                await absensiModel.insertToListMac(query.mac);
                await absensiModel.insertAbsensi(query);
                query.macDetail=await absensiModel.promiseGetDetailMacID(query.mac);
                query.detailUser=dataUser;
                req.app.io.emit('absensi', query);
                res.status(200).send({success: true, message: "Data Berhasil Dikirim"});
            }
        }catch (err){
            console.log(err);
            res.status(200).send({success: false, message: "Data Gagal Diambil"});
        }
    }
});
router.post('/pengujian', async(req, res) => {
    let query=req.body;
    if (query.jumlah===undefined||query.tag===undefined)res.status(200).send({success: false, message: "Parameter tidak Lengkap"});
    else {
        try{
            let start = new Date().getTime();
            let Jumlah=parseInt(query.jumlah);
            let tag=query.tag;
            let amqp = require('amqplib/callback_api');
            let broker_uri = "amqp://achmadridho:0711811526@167.205.7.226:5672/%2fabsensimanbaulhuda?heartbeat=10";

            let exchangeName = "amq.topic";
            let countProccess=1;
            await absensiModel.insertPengujianSummary(tag,Jumlah);
            amqp.connect(broker_uri, function(err, conn) {
                conn.createChannel(function(err, ch) {
                    ch.assertQueue('', {exclusive: true}, function(err, q) {
                        console.log("success creating connection to RabbitMq");
                        req.app.io.emit('status', "success creating connection to RabbitMq");
                        res.status(200).send({success: true, message: "Data Berhasil Dikirim"});
                        let msg = {tipe:0,tag:tag,starttime:new Date().getTime()};
                        for(let i=1;i<=Jumlah;i++){
                            msg.antrian=i;
                            console.log(msg.antrian);
                            ch.publish(exchangeName, "absensi.service", new Buffer(JSON.stringify(msg)),
                                {});
                            console.log(" [x] Sent ");
                            if(countProccess===Jumlah){
                                let end = new Date().getTime();
                                let timeDifferenceinSecond=(end-start)/1000
                                console.log(timeDifferenceinSecond);
                                absensiModel.updateQueueInsertTime(tag,timeDifferenceinSecond);

                            }
                            countProccess++;
                        }
                        req.app.io.emit('status', "success sending all data to queue");
                    });
                });
            });

        }catch (err){
            console.log(err);
            res.status(200).send({success: false, message: "Pengujian Gagal"});
        }
    }
});
router.post('/update-mac', async(req, res) => {
    let query=req.body;
    console.log(query);
    if (query.MacID===undefined||query.KodeRuangan===undefined||query.NamaRuangan===undefined){
        req.flash('pesan', "Silahkan Lengkapi Data");
        res.redirect('/authenticated-alat-setting');
    }
    else {
        try{
            await absensiModel.updateDataMacList(query);
            req.flash('pesan', "Berhasil Mengubah Data");
            res.redirect('/authenticated-alat-setting');
        }catch (err){
            console.log(err);
            req.flash('pesan', "Gagal Merubah Data");
            res.redirect('/authenticated-alat-setting');
        }
    }
});
router.post('/change/status/by/id', async(req, res) => {
    let query=req.body;
    console.log(query);
    if (query.Status===undefined||query._id===undefined){
        res.status(200).send({success: false, message: "Lengkapi Parameter"});
    }
    else {
        try{
            await absensiModel.updateStatusDevice(query._id,query.Status);
            res.status(200).send({success: true, message: "Data Berhasil Di Update"});
        }catch (err){
            console.log(err);
            res.status(200).send({success: false, message: "Data Gagal Di Update"});
        }
    }
});
router.post('/delete-mac', async(req, res) => {
    let query=req.body;
    console.log(query);
    if (query.Password===undefined||query._id===undefined){
        req.flash('pesan', "Silahkan Lengkapi Data");
        res.redirect('/authenticated-alat-setting');
    }
    else {
        try{
            let checkadmin= await userModel.checkIfAdmin(req.session._id);
            if(checkadmin){
                let passwordFromDb=checkadmin.Password;
                if(passwordFromDb!==undefined){
                    if(bcyrpt.compareSync(query.Password,passwordFromDb)){
                        await absensiModel.deleteMacFromMacListDocument(query._id);
                        req.flash('pesan', "Berhasil Menghapus data");
                        res.redirect('/authenticated-alat-setting');
                    }else {
                        req.flash('pesan', "Password Salah");
                        res.redirect('/authenticated-alat-setting');
                    }
                }else {
                    req.flash('pesan', "Akun Belum Aktif");
                    res.redirect('/authenticated-alat-setting');
                }
            }else {
                req.flash('pesan', "Gagal Meghapus Data");
                res.redirect('/authenticated-alat-setting');
            }

        }catch (err){
            console.log(err);
            req.flash('pesan', "Gagal Meghapus Data");
            res.redirect('/authenticated-alat-setting');
        }
    }

});
router.get('/today/list', async(req, res) => {
    try{
        let listMacList=await absensiModel.getListAbsenToday();
        res.status(200).send({success: true, message: "Data Berhasil Diambil",listmac:listMacList});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});
router.post('/getby/date/noinduk', async(req, res) => {
    let query=req.body;
    let SearchString=query.SearchString;
    let TanggalInput=query.TanggalInput;
    if (SearchString===undefined||TanggalInput===undefined)res.status(200).send({success: false, message: "Parameter tidak Lengkap"});
    else {
        try{
            let listUsers=await userModel.findUserByString(SearchString);
            if(listUsers.length>0){
                let generatedDate=moment(TanggalInput,"DD/MM/YYYY",'id');
                let generatedDate2=moment(TanggalInput,"DD/MM/YYYY",'id').add(1,'days');
                let lastDate=new Date(generatedDate);
                let newDate = new Date(generatedDate2);
                let listMacs=await absensiModel.getListAllMac();
                let results=Array();
                for(let listuser of listUsers){
                    let listabsen=Array();
                    for (let listrfid of listuser.rf_id){
                        for(let listmac of listMacs){
                            let result=await absensiModel.findAbsenByMacRfidDate(listmac.mac,listrfid,lastDate,newDate);
                            if(result.length>0){
                                for(let i = 0; i< result.length; i++){
                                    result[i].namaruangan=listmac.namaruangan;
                                    result[i].koderuangan=listmac.koderuangan;
                                    listabsen.push(result[i]);
                                }

                            }
                        }
                    }
                    listuser.listabsen=listabsen;
                    results.push(listuser);
                }
                res.status(200).send({success: true, message: "Data Berhasil Diambil",results:results});
            }else {
                res.status(200).send({success: false, message: "Data Tidak Ditemukan"});
            }
        }catch (err){
            console.log(err);
            res.status(200).send({success: false, message: "Data Gagal Diambil"});
        }
    }
});
router.get('/test', async(req, res) => {
    req.app.io.emit('absensi', 'tessssss');
    res.status(200).send({success: false, message: "Data Gagal Diambil"});
});

module.exports = router;
