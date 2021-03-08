var express = require('express');
var url = require('url');
var path = require('path');
var staff = require('../service/m_staff');
var service = require('../action/service');
const serviceHomeAttendance = require('../service/homeAttendance');
const actionHomeAttendance = require('./homeAttendance');
const actionHomeStaff = require('./homeStaff');

/**
 * 	身份确认
 */
this.check = function(req,res,next){
	service.checkOpenId(req,res,next,function(){
		service.checkPerson(req,res,next,function(){
			var code = req.session.code;
			var open_id = req.session.open_id;
			staff.check({
				code: code,
				open_id: open_id
			},function(result){
				if(result.code==200){
					next();
				}else{
					res.render('./pages/tip',{
						tip: result.msg
					});
				}
			});
		});
	});
}

/**
 * 	首页
 */
this.main = function(req,res,next){
	staff.main({
		open_id: req.session.open_id
	},function(result){
		res.render('./pages/m_staff',{
			result: result
		});
	});
}

/**
 *  签到页面
 */
this.sign = (req,res,next) => {
	const { open_id } = req.session;
	staff.getStaffInfoByOpenId(open_id,result => {
		res.render('./pages/m_staff_sign',{
			user_name: result.dataValues.user_name,
			user_id: result.dataValues.user_id,
			hasMobileStaffArr: CONFIG.hasMobileStaffArr
		});
	});
}

/**
 *  签到信息
 */
this.signInfo = (req,res,next) => {
	const admin_id = req.session.admin_id;
	serviceHomeAttendance.workingNum({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  点击客服值日
 */
this.cusDuty = (req,res,next) => {
	const admin_id = req.session.admin_id;
	staff.cusDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  点击安卫值日
 */
this.safeDuty = (req,res,next) => {
	const admin_id = req.session.admin_id;
	staff.safeDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  点击内勤值日
 */
this.insideDuty = async (req, res, next) => {
	const admin_id = req.session.admin_id;
	staff.insideDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  撤销上班
 */
this.recall = (req,res,next) => {
	actionHomeAttendance.recall(req,res,next);
}

/**
 *  撤销加班
 */
this.recallOverWork = (req,res,next) => {
	actionHomeAttendance.recallOverWork(req,res,next);
}

this.applyAbsence = (req, res, next) => {
	actionHomeAttendance.applyAbsence(req,res,next);
}

/**
 *  获取指派人列表
 */
this.getDirectorListByLevel = (req,res,next) => {
	actionHomeStaff.getListByLevel(req,res,next);
}

/**
 *  在线考核信息
 */
this.onlineAssessment = (req,res,next) => {
	actionHomeAttendance.onlineAssessment(req,res,next);
}

/**
 *  签到
 *  0 -> 1
 */
this.signIn = (req,res,next) => {
	actionHomeAttendance.sign(req,res,next);
}

/**
 *  补签到信息
 */
this.signGps = (req,res,next) => {
	actionHomeAttendance.signGps(req,res,next);
}

/**
 *  离岗
 *  1 -> 0
 */
this.leave = (req,res,next) => {
	actionHomeAttendance.leave(req,res,next);
}

/**
 *  外出
 *  1 -> 2
 */
this.goOut = (req,res,next) => {
	actionHomeAttendance.goOut(req,res,next);
}

/**
 *  返岗
 *  2 -> 1
 */
this.outBack = (req,res,next) => {
	actionHomeAttendance.outBack(req,res,next);
}

/**
 *  返岗
 *  2 -> 0
 */
this.outLeave = (req,res,next) => {
	actionHomeAttendance.outLeave(req,res,next);
}

/**
 *  加班
 *  3 -> 4
 */
this.overWork = (req,res,next) => {
	actionHomeAttendance.overWork(req,res,next);
}

/**
 *  补加班的gps信息
 */
this.overWorkGps = (req,res,next) => {
	actionHomeAttendance.overWorkGps(req,res,next);
}

/**
 *  结束加班
 *  4 -> 3
 */
this.endOverWork = (req,res,next) => {
	actionHomeAttendance.endOverWork(req,res,next);
}

/**
 * 	基本信息
 */
this.basicInfo = function(req,res,next){
	staff.main({
		open_id: req.session.open_id
	},function(result){
		res.render('./pages/m_staff_basic_info',{
			result: result
		});
	});
}

/**
 * 	基本信息编辑
 */
this.basicInfoEdit = function(req,res,next){
	staff.main({
		open_id: req.session.open_id
	},function(result){
		res.render('./pages/m_staff_basic_info_edit',{
			result: result
		});
	});
}

/**
 * 	上传头像
 */
this.uploadImg = function(req,res,next){
	staff.uploadImg(req,function(result){
		SEND(res,200,'',result);
	});
}

/**
 * 	基本信息提交
 */
this.basicInfoSub = function(req,res,next){
	var open_id = req.session.open_id;
	var formData = JSON.parse(req.body.formData);
	staff.basicInfoSub({
		open_id: open_id,
		formData: formData
	},function(result){
		SEND(res,200,'提交成功',[]);
	});
}

/**
 * 	工资信息
 */
this.salaryInfo = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var open_id = req.session.open_id;
	staff.salaryInfo({
		open_id: open_id,
		y_m_salary: params.y_m_salary
	},function(result){
		if(!params.y_m_salary){
			if(result.code==-1){
				res.render('./pages/tip',{
					tip: result.msg
				});
			}else{
				res.render('./pages/m_staff_salary_info',{
					result: result
				});
			}
		}else{
			SEND(res,200,'',result);
		}
	});
}

/**
 * 	同事圈
 */
this.colleagueInfo = function(req,res,next){
	var open_id = req.session.open_id;
	staff.colleagueInfo({
		open_id: open_id
	},function(result){
		res.render('./pages/m_staff_colleague',{
			result: result
		});
	});
}

/**
 * 	同事圈关联信息
 */
this.colleagueInfoMore = function(req,res,next){
	var pathname = url.parse(req.url,true).pathname;
	var user_id = pathname.split('colleagueInfo/')[1];
	staff.colleagueRelativeInfo({
		user_id: user_id
	},function(result){
		res.send(result);
	});
}