const express = require('express');
const router = express.Router();
const userModel = require('../model/user_model');
const absensiModel = require('../model/absensi_model');
const analisisAbsensiModel = require('../model/analisisabsensi_model');
let bcyrpt=require('bcrypt-nodejs');
const moment = require('moment');
let id = require('moment/locale/id');

router.post('/list/by/date', async(req, res) => {
    let query=req.body;
    console.log(query);
    if (query.StartTime===undefined||query.EndTime===undefined){
        res.status(200).send({success: false, message: "Parameter Tidak Lengkap"});
    }
    else {
        try{
            let listMAC=await analisisAbsensiModel.getListMac();
            let iteratedListAbsen=await iterateMultipleAbsenList(listMAC,query.StartTime,query.EndTime);
            res.status(200).send({success: true, message: "Data Berhasil Diambil",list:iteratedListAbsen});
        }catch (err){
            console.log(err);
            res.status(200).send({success: false, message: "Data Gagal Diambil"});
        }
    }
});
function iterateMultipleAbsenList(items,starttime,endtime) {
    return new Promise((resolve, reject)=>{
        let arrAbsen=[];
        let maxCount = (items.length > 0) ? items.length-1 : 0;
        let countProccess=0;
        items.forEach(function (indexmac) {
            try {
                analisisAbsensiModel.getListAbsenByMacIDStartEndTime(indexmac.mac,starttime,endtime,function (err,listAbsen) {
                    if(err)reject(err);
                    else {
                        listAbsen.macDetail=indexmac;
                        arrAbsen.push.apply(arrAbsen,listAbsen);
                        if (countProccess === maxCount) {
                            arrAbsen.sort(compare);
                            resolve(arrAbsen);
                        }
                        countProccess++;
                    }
                });
            }catch (err){
                reject(err);
            }
        });
    });
}
function compare(a,b) {
    if (a.date < b.date)
        return -1;
    if (a.date > b.date)
        return 1;
    return 0;
}

router.get('/generate/data', async(req, res) => {
    try{
        let listRfid=await userModel.getListRfidSiswa();
        let listMac=await absensiModel.getListAllMac();
        let iteratedList=await generateListQuery(listRfid,listMac);
        res.status(200).send({success: true, message: "Data Berhasil Diambil",list:iteratedList});
    }catch (err){
        console.log(err);
        res.status(200).send({success: false, message: "Data Gagal Diambil"});
    }
});

function generateListQuery(listRfid,listMac){
    return new Promise((resolve, reject)=>{
        let dateFormat="DD/MM/YYYY H:m";
        let maxCount = (listRfid.length > 0) ? listRfid.length-1 : 0;
        let countProccess=0;
        listRfid.forEach(function (index) {
            let query={};
            let waktuMulai=moment("7/10/2017 7:"+getRandomArbitrary(0,59),dateFormat,'id');
            query.rf_id=index;
            query.date=new Date(waktuMulai);
            query.tanggal=waktuMulai.format("dddd, DD/MM/YYYY",'id');
            query.waktu=waktuMulai.format("HH:mm:ss");
            query.mac=listMac[getRandomArbitrary(0,7)].mac;
            absensiModel.insertAbsensi2(query,function (err,result) {
                if(err)reject(err);
                if (countProccess === maxCount) {
                    resolve(true);
                }
                countProccess++;
            });
        });
    });
}
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;
