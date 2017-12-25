const app = require('../app');
const moment = require('moment');
let database = app.db;
let macCollection = database.collection('maclist');
let usersCollection = database.collection('users');
let pengujianSummaryCollection = database.collection('pengujian_summary');
let pengujianCollection = database.collection('pengujian');
let ObjectId = require('mongodb').ObjectID;
let id = require('moment/locale/id');

ratarataWaktuSimpanDatabase = (tag) => {
    return new Promise((resolve, reject)=>{
        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $group:{
                    _id:"$tag",
                    rata2:{$avg:"$waktusimpandb"},
                    max:{$max:"$waktusimpandb"},
                    min:{$min:"$waktusimpandb"}
                }
            }
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result[0]);
        });
    });
};
ratarataWaktuDalamAntrian = (tag) => {
    return new Promise((resolve, reject)=>{
        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $group:{
                    _id:"$tag",
                    rata2:{$avg:"$waktudalamantrian"},
                    max:{$max:"$waktudalamantrian"},
                    min:{$min:"$waktudalamantrian"}
                }
            }
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result[0]);
        });
    });
};
ratarataWaktuPengujian = (tag) => {
    return new Promise((resolve, reject)=>{
        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $group:{
                    _id:"$tag",
                    rata2:{$avg:"$waktuproses"},
                    max:{$max:"$waktuproses"},
                    min:{$min:"$waktuproses"}
                }
            }
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result[0]);
        });
    });
};
getSummaryPengujian = (tag) => {
    return new Promise((resolve, reject)=>{
        pengujianSummaryCollection.findOne({tag:tag}, (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};
getListDetailWaktuSimpanDB = (tag) => {
    return new Promise((resolve, reject)=>{

        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $project:{
                    x:"$antrian",
                    y:"$waktusimpandb"
                }
            },
            {$sort:{
                x:1
            }}
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result);
        });
    });
};
getListDetailWaktuDalamAntrian = (tag) => {
    return new Promise((resolve, reject)=>{

        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $project:{
                    x:"$antrian",
                    y:"$waktudalamantrian"
                }
            },
            {$sort:{
                x:1
            }}
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result);
        });
    });
};
getListDetailPengujian = (tag) => {
    return new Promise((resolve, reject)=>{

        pengujianCollection.aggregate([

            {
                $match:{
                    tag:tag
                }
            },
            {
                $project:{
                    x:"$antrian",
                    y:"$waktuproses"
                }
            },
            {$sort:{
                x:1
            }}
        ],function (err,result) {
            if(err)reject(err);
            else resolve(result);
        });
    });
};
getListPengujian = () => {
    return new Promise((resolve, reject)=>{
        pengujianSummaryCollection.find({}).toArray( (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};
updateInsertToDbTime=(tag,antrian,dbsavetime,proccesstime)=>{
    return new Promise((resolve,reject)=>{
        pengujianCollection.updateOne({tag: tag,antrian:antrian},{ $set:
            {
                waktusimpandb:dbsavetime,
                waktuproses:proccesstime
            }
        }, function(err, result) {
            if(err){
                reject(err);
            }else {
                resolve(result);
            }
        });
    });
};
updateQueueInsertTime=(tag,time)=>{
    return new Promise((resolve,reject)=>{
        pengujianSummaryCollection.updateOne({tag: tag},{ $set:
            {
                insert_queue_time:time
            }
        }, function(err, result) {
            if(err){
                reject(err);
            }else {
                resolve(result);
            }
        });
    });
};

insertPengujianSummary = (tag,jumlah) => {
    return new Promise((resolve, reject)=>{
        let today=moment(new Date());
        pengujianSummaryCollection.insertOne({
            tag:tag,
            jumlah:jumlah,
            mulai_pengujian:new Date(),
            tanggal:today.format("dddd, DD/MM/YYYY",'id'),
            waktu:today.format("HH:mm:ss")
        }, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        });
    });
};
insertPengujian = (tag,antrian,start,timeinqueue) => {
    return new Promise((resolve, reject)=>{
        pengujianCollection.insertOne({
            tag:tag,
            antrian:antrian,
            waktudalamantrian:timeinqueue,
        }, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        });
    });
};
insertToListMac = (MacID) => {
    return new Promise((resolve, reject)=>{
        macCollection.insertOne({
            mac:MacID,
            kelasassigned:false,
            koderuangan:"",
            namaruangan:"",
            status:0
        }, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        });
    });
};
insertAbsensi = (query) => {
    return new Promise((resolve, reject)=>{
        database.collection(query.mac).insertOne(query, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        });
    });
};
insertAbsensi2 = (query,callback) => {
    database.collection(query.mac).insertOne(query, (err, result) => {
        if(err) callback(err,null);
        else callback(null,result);
    });
};
getListAllMac = () => {
    return new Promise((resolve, reject)=>{
        macCollection.find({}).toArray( (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};

findMacByMacID = (MacID) => {
    return new Promise((resolve, reject)=>{
        macCollection.find({mac:MacID}).toArray( (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};
findAbsenByMacRfidDate = (MacID,RFID,DateMin,DateMax) => {
    return new Promise((resolve, reject)=>{
        database.collection(MacID).find({$and:[
            {rf_id:RFID}, {
                date:{
                    $gte:DateMin,
                    $lt:DateMax
                }
            }
            ]}).toArray( (err, results) => {
            if(err)reject(err);
            else resolve(results);
        });
    });
};
getListAbsenByMacID = (MacID) => {
    return new Promise((resolve, reject)=>{
        database.collection(MacID).find().toArray( (err, results) => {
            if(err)reject(err);
            else {
                iterateAbsenList(MacID,results,function (err,iteratedResult) {
                   if(err)reject(err)
                   else resolve(iteratedResult);
                });
            }
        });
    });
};
getListAbsenByMacIDStartEndTime = (MacID,StartTime,EndTime) => {
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
getListAbsenToday = () => {
    return new Promise((resolve, reject)=>{
        macCollection.find({}).toArray( (err, results) => {
            if(err)reject(err);
            else {
                iterateMultipleAbsenList(results,function (err,Listabsen) {
                   if(err)reject(err);
                   else resolve(Listabsen);
                });
            }
        });
    });
};
updateDataMacList=(query)=>{
  return new Promise((resolve,reject)=>{
      macCollection.updateOne({_id: ObjectId(query._id)},{ $set:
          {
              kelasassigned:true,
              koderuangan:query.KodeRuangan,
              namaruangan:query.NamaRuangan
          }
      }, function(err, result) {
          if(err){
              reject(err);
          }else {
              resolve(result);
          }
      });
  });
};
updateStatusDevice=(_id,Status)=>{
  return new Promise((resolve,reject)=>{
      macCollection.updateOne({_id: ObjectId(_id)},{ $set:
          {
              status:parseInt(Status)
          }
      }, function(err, result) {
          if(err){
              reject(err);
          }else {
              resolve(result);
          }
      });
  });
};
updateStatusDeviceByMac=(mac,Status)=>{
  return new Promise((resolve,reject)=>{
      macCollection.updateOne({mac: mac},{ $set:
          {
              status:parseInt(Status)
          }
      }, function(err, result) {
          if(err){
              reject(err);
          }else {
              resolve(result);
          }
      });
  });
};
deleteMacFromMacListDocument=(MacID)=>{
  return new Promise((resolve,reject)=>{
      macCollection.removeOne({_id:ObjectId(MacID)},function (err,result) {
         if(err)reject(err);
         else resolve(result);
      });
  }) ;
};
function getListAbsenTodayByMacID(MacID,callback) {
    var today = new Date();
    today.setHours(0,0,0,0);
    database.collection(MacID).find({
        date:{
            $gte:today
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
}

function getDetailMacID(MacID,callback) {
    macCollection.findOne({mac:MacID},function (err,result) {
       if(err)callback(err,null);
       else callback(null,result);
    });
}
promiseGetDetailMacID=(MacID)=>{
    return new Promise((resolve,reject)=>{
        macCollection.findOne({mac:MacID},function (err,result) {
            if(err)reject(err);
            else resolve(result);
        });
    }) ;
};
promiseCheckMacStatus=(MacID)=>{
    return new Promise((resolve,reject)=>{
        macCollection.findOne({mac:MacID},function (err,result) {
            if(err)reject(err);
            else {
                if(result){
                    if(result.status===0){
                        resolve(true)
                    }else {
                        resolve(false)
                    }
                }else resolve(false)
            }
        });
    }) ;
};
function getDetailUser(rf_id,callback) {
    usersCollection.findOne({rf_id:rf_id},function (err,result) {
       if(err)callback(err,null);
       else {
           if(result)callback(null,result);
           else callback(null,false);
       }
    });
}
promiseGetDetailUser=(rf_id)=>{
    return new Promise((resolve,reject)=>{
        usersCollection.findOne({rf_id:rf_id},function (err,result) {
            if(err)reject(err);
            else {
                if(result)resolve(result);
                else resolve(false);
            }
        });
    }) ;
};
function iterateMultipleAbsenList(items, callback) {
    let arrAbsen=[];
    let maxCount = (items.length > 0) ? items.length-1 : 0;
    let countProccess=0;
    items.forEach(function (indexmac) {
        try {
          getListAbsenTodayByMacID(indexmac.mac,function (err,listAbsen) {
              if(err)callback(err,null);
              else {
                  listAbsen.macDetail=indexmac;
                  arrAbsen.push.apply(arrAbsen,listAbsen);
                  if (countProccess === maxCount) {
                      callback(null, arrAbsen);
                  }
                  countProccess++;
              }
          });
        }catch (err){
            callback(err,null);
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
                   var time=moment(index.date);
                   index['tanggal']=time.format("dddd, DD/MM/YYYY",'id');
                   index['waktu']=time.format("HH:mm:ss");

                   getDetailUser(index.rf_id,function (err,detailUser) {
                      if(err)callback(err,null);
                      else {
                          index['detailUser']=detailUser;
                          arrResult.push(index);
                          if (countProccess === maxCount) {
                              for (var i = 0; i < arrResult.length; i++) {
                                  delete arrResult[i].index;
                              }
                              arrResult.sort(compare);
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
module.exports = {
    getListAllMac:getListAllMac,
    getListAbsenByMacID:getListAbsenByMacID,
    getListAbsenByMacIDStartEndTime:getListAbsenByMacIDStartEndTime,
    findMacByMacID:findMacByMacID,
    insertToListMac:insertToListMac,
    insertAbsensi:insertAbsensi,
    getListAbsenToday:getListAbsenToday,
    updateDataMacList:updateDataMacList,
    deleteMacFromMacListDocument:deleteMacFromMacListDocument,
    promiseGetDetailUser:promiseGetDetailUser,
    promiseGetDetailMacID:promiseGetDetailMacID,
    findAbsenByMacRfidDate:findAbsenByMacRfidDate,
    updateStatusDevice:updateStatusDevice,
    promiseCheckMacStatus:promiseCheckMacStatus,
    updateStatusDeviceByMac:updateStatusDeviceByMac,
    insertAbsensi2:insertAbsensi2,
    insertPengujianSummary:insertPengujianSummary,
    updateQueueInsertTime:updateQueueInsertTime,
    insertPengujian:insertPengujian,
    getListPengujian:getListPengujian,
    ratarataWaktuPengujian:ratarataWaktuPengujian,
    getSummaryPengujian:getSummaryPengujian,
    getListDetailPengujian:getListDetailPengujian,
    updateInsertToDbTime:updateInsertToDbTime,
    ratarataWaktuSimpanDatabase:ratarataWaktuSimpanDatabase,
    ratarataWaktuDalamAntrian:ratarataWaktuDalamAntrian,
    getListDetailWaktuSimpanDB:getListDetailWaktuSimpanDB,
    getListDetailWaktuDalamAntrian:getListDetailWaktuDalamAntrian
};