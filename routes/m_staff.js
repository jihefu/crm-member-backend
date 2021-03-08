var express = require('express');
var url = require('url');
var path = require('path');
var staff = require('../action/m_staff');
const actionGoods = require('../action/homeGoods');

module.exports = function(app){
	app.use('/m/staff',function(req,res,next){
		staff.check(req,res,next);
	});
	app.use('/g',function(req,res,next){
		staff.check(req,res,next);
	});
	app.use('/gc',function(req,res,next){
		staff.check(req,res,next);
	});
	app.use('/borrowHistory',function(req,res,next){
		staff.check(req,res,next);
	});
	app.get('/m/staff',function(req,res,next){
		staff.main(req,res,next);
	});
	app.get('/m/staff/sign',function(req,res,next){
		staff.sign(req,res,next);
	});
	app.get('/m/staff/basicInfo',function(req,res,next){
		staff.basicInfo(req,res,next);
	});
	app.get('/m/staff/basicInfoEdit',function(req,res,next){
		staff.basicInfoEdit(req,res,next);
	});
	app.get('/m/staff/salaryInfo',function(req,res,next){
		staff.salaryInfo(req,res,next);
	});
	app.get('/m/staff/colleagueInfo',function(req,res,next){
		staff.colleagueInfo(req,res,next);
	});
	app.get('/m/staff/colleagueInfo/*',function(req,res,next){
		staff.colleagueInfoMore(req,res,next);
	});


	app.post('/m/staff/uploadImg',function(req,res,next){
		staff.uploadImg(req,res,next);
	});
	app.put('/m/staff/basicInfoSub',function(req,res,next){
		staff.basicInfoSub(req,res,next);
	});

	app.get('/m/attendance/signInfo',function(req,res,next){
		staff.signInfo(req,res,next);
	});
	app.get('/m/attendance/sign',function(req,res,next){
		staff.signIn(req,res,next);
	});
	app.get('/m/attendance/leave',function(req,res,next){
		staff.leave(req,res,next);
	});
	app.post('/m/attendance/cusDuty',function(req,res,next){
		staff.cusDuty(req,res,next);
	});
	app.post('/m/attendance/safeDuty',function(req,res,next){
		staff.safeDuty(req,res,next);
	});
	app.post('/m/attendance/insideDuty',function(req,res,next){
		staff.insideDuty(req,res,next);
	});
	app.delete('/m/attendance/recall', function(req, res, next) {
		staff.recall(req,res,next);
	});
	app.get('/m/attendance/getDirectorListByLevel', function(req, res, next) {
		staff.getDirectorListByLevel(req,res,next);
	});
	app.put('/m/attendance/goOut', function(req, res, next) {
		staff.goOut(req,res,next);
	});
	app.put('/m/attendance/outBack', function(req, res, next) {
		staff.outBack(req,res,next);
	});
	app.put('/m/attendance/outLeave', function(req, res, next) {
		staff.outLeave(req,res,next);
	});
	app.put('/m/attendance/overWork', function(req, res, next) {
		staff.overWork(req,res,next);
	});
	app.put('/m/attendance/endOverWork', function(req, res, next) {
		staff.endOverWork(req,res,next);
	});
	app.delete('/m/attendance/recallOverWork', function(req, res, next) {
		staff.recallOverWork(req,res,next);
	});
	app.put('/m/attendance/signGps', function(req, res, next) {
		staff.signGps(req,res,next);
	});
	app.put('/m/attendance/overWorkGps', function(req, res, next) {
		staff.overWorkGps(req,res,next);
	});
	app.post('/m/attendance/applyAbsence', function(req, res, next) {
		staff.applyAbsence(req,res,next);
	});

	app.get('/m/attendance/onlineAssessment', function(req, res, next) {
		staff.onlineAssessment(req,res,next);
	});

	app.get('/g/:numbering',function(req,res,next){
		actionGoods.targetItem(req,res,next);
	});
	app.put('/gc/applyBorrow',function(req,res,next){
		actionGoods.applyBorrow(req,res,next);
	});
	app.put('/gc/aggreeBorrow',function(req,res,next){
		actionGoods.agreeBorrow(req,res,next);
	});
	app.put('/gc/notAggreBorrow',function(req,res,next){
		actionGoods.notAggreBorrow(req,res,next);
	});
	app.put('/gc/applyBack',function(req,res,next){
		actionGoods.applyBack(req,res,next);
	});
	app.put('/gc/aggreBack',function(req,res,next){
		actionGoods.aggreBack(req,res,next);
	});
	app.get('/gc/photoEdit',function(req,res,next){
		actionGoods.photoEdit(req,res,next);
	});
	app.post('/gc/uploadImg',function(req,res,next){
		actionGoods.upload(req,res,next);
	});
	app.put('/gc/updateAlbum',function(req,res,next){
		actionGoods.updateAlbum(req,res,next);
	});
	app.put('/gc/applyDel',function(req,res,next){
		actionGoods.applyDel(req,res,next);
	});
	app.put('/gc/dealDel',function(req,res,next){
		actionGoods.del(req,res,next);
	});
	app.put('/gc/cancelDealDel',function(req,res,next){
		actionGoods.cancelDealDel(req,res,next);
	});
	app.get('/borrowHistory/:numbering',function(req,res,next){
		actionGoods.borrowHistory(req,res,next);
	});
	app.get('/gc/editBorrow',function(req,res,next){
		actionGoods.editBorrow(req,res,next);
	});
	app.put('/gc/updateEditBorrow',function(req,res,next){
		actionGoods.updateEditBorrow(req,res,next);
	});
	app.get('/gc/getPhotoInfo',function(req,res,next){
		actionGoods.getPhotoInfo(req,res,next);
	});
	app.put('/gc/addMainId',function(req,res,next){
		actionGoods.addMainId(req,res,next);
	});
	app.put('/gc/removeMainId',function(req,res,next){
		actionGoods.removeMainId(req,res,next);
	});
	app.post('/gc/directBorrow',function(req,res,next){
		actionGoods.directBorrow(req,res,next);
	});
}