const app = require('../app');
const moment = require('moment');
let database = app.db;
let macCollection = database.collection('maclist');
let usersCollection = database.collection('users');
let ObjectId = require('mongodb').ObjectID;
let id = require('moment/locale/id');

exports.getListMac = () => {
    return new Promise((resolve, reject)=>{
        macCollection.find({}).toArray( (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};

exports.getListAbsenByMacIDStartEndTime = (MacID,StartTime,EndTime) => {
    return new Promise((resolve, reject)=>{
        database.collection(MacID).find({
            date:{
                $gte:new Date(StartTime),
                $lt:new Date(EndTime)
            }
        }).toArray( (err, results) => {
            if(err)reject(err);
            else {
                iterateAbsenList(MacID,results,function (err,iteratedResult) {
                    if(err)reject(err);
                    else resolve(iteratedResult);
                });
            }
        });
    });
};
exports.getListAbsenByMacIDStartEndTime = (MacID,StartTime,EndTime,callback) => {
    database.collection(MacID).find({
        date:{
            $gte:new Date(StartTime),
            $lt:new Date(EndTime)
        }
    }).toArray( (err, results) => {
        if(err)callback(err,null);
        else {
            iterateAbsenList(MacID,results,function (err,iteratedResult) {
                if(err)callback(err,null);
                else callback(null,iteratedResult);
            });
        }
    });
};

function getDetailMacID(MacID,callback) {
    macCollection.findOne({mac:MacID},function (err,result) {
        if(err)callback(err,null);
        else callback(null,result);
    });
}

function getDetailUser(rf_id,callback) {
    usersCollection.findOne({rf_id:rf_id},function (err,result) {
        if(err)callback(err,null);
        else {
            if(result)callback(null,result);
            else callback(null,false);
        }
    });
}
function iterateAbsenList(MacID,items, callback) {
    getDetailMacID(MacID,function (err,result) {
        if(err)callback(err,null);
        else {
            for(let i = 0; i< items.length; i++){
                items[i].index = i;
                items[i].macDetail=result;
            }
            let arrResult = [];
            let maxCount = (items.length > 0) ? items.length-1 : 0;
            let countProccess=0;
            if(items.length > 0) {
                items.forEach(function (index) {
                    let time=moment(index.date);
                    index['tanggal']=time.format("dddd, DD/MM/YYYY",'id');
                    index['waktu']=time.format("HH:mm:ss");

                    getDetailUser(index.rf_id,function (err,detailUser) {
                        if(err)callback(err,null);
                        else {
                            index['detailUser']=detailUser;
                            arrResult.push(index);
                            if (countProccess === maxCount) {
                                for (let i = 0; i < arrResult.length; i++) {
                                    delete arrResult[i].index;
                                }

                                arrResult = arrResult.filter((arrResult, index, self) => self.findIndex((t) => {return t.rf_id === arrResult.rf_id}) === index)
                                callback(null, arrResult);
                            }
                            countProccess++;
                        }
                    });
                });
            }else callback(null, arrResult);
        }
    });
}

function compare(a,b) {
    if (a.date < b.date)
        return -1;
    if (a.date > b.date)
        return 1;
    return 0;
}