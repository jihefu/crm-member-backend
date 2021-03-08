const multer = require('multer');
const policyHome = require('../policies/home');
const actionHomeLogin = require('../action/homeLogin');
const actionHomeMenu = require('../action/homeMenu');
const actionCustomer = require('../action/homeCustomers');
const actionUsers = require('../action/homeUsers');
const actionOutput = require('../action/homeOutput');
const actionStaff = require('../action/homeStaff');
const actionContacts = require('../action/homeContacts');
const actionMember = require('../action/homeMember');
const actionContracts = require('../action/homeContracts');
const actionRepairs = require('../action/homeRepairs');
const actionGoods = require('../action/homeGoods');
const actionOrder = require('../action/homeContactsOrder');
const actionAttendance = require('../action/homeAttendance');
const actionAffairs = require('../action/homeRoutineAffairs');
const actionNotiPost = require('../action/NotiPost');
const actionNotiSystem = require('../action/homeNotiSystem');
const actionPayments = require('../action/actionPayments');
const actionPricing = require('../action/homePricing');
const actionProductsLibrary = require('../action/homeProductsLibrary');
const actionWallet = require('../action/homeWallet');
const hybridOrder = require('../action/hybrid_app');
const actionSoftProject = require('../action/homeSoftProject');
const socketWebrtc = require('../action/socketWebrtc');
const actionFileSys = require('../action/homeFileSys');
const sendMQ = require('../service/rabbitmq').sendMQ;
const actionPublicRelationShip = require('../action/homePublicRelationShip');
const actionBuyer = require('../action/homeBuyer');
const actionEndUser = require('../action/homeEndUser');
const actionVerUnit = require('../action/homeVerUnit');
const actionSmsTemp = require('../action/homeSmsTemp');
const common = require('../action/common');
const actionVir = require('../action/homeVir');
const actionProducts = require('../action/homeProducts');
const actionSnCreateTool = require('../action/actionSnCreateTool');
const actionSolutionTree = require('../action/homeSolutionTree');
const actionBusinessTrip = require('../action/homeBusinessTrip');
const actionSimuCtrl = require('../action/homeSimuCtrl');
const actionVehicleRegist = require('../action/homeVehicleRegist');
const actionCloudDisk = require('../action/cloudDisk');
const internalAction = require('../action/internal');
const actionProductOrder = require('../action/homeProductOrder');
const actionSeckill = require('../action/seckill');

module.exports = function(app) {
    app.get('/home', function(req, res, next) {
        res.sendFile(DIRNAME + '/build/index.html');
    });
    app.post('/home/wxLoginCheck', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        actionHomeLogin.wxLoginCheck(req, res, next);
    });
    app.get('/platform', function(req, res, next) {
        res.redirect('/home');
        // res.sendFile(DIRNAME+'/build/index.html');
    });
    app.post('/home/login', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        actionHomeLogin.login(req, res, next);
    });
    // 下载威程配置模板
    app.get('/home/vir/downloadTemp/:name', (req, res, next) => {
        actionVir.downloadTemp(req, res, next);
    });
    app.options('/home/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.send('200');
    });
    app.use('/home/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        policyHome.checkSessionExist(req, res, next);
    });
    
    app.post('/home/internal/consumeYBScore', function(req, res, next) {
        internalAction.consumeYBScore(req, res, next);
    });

    app.get('/home/source/product/:sn([0-9]+)', function(req, res, next) {
        actionHomeMenu.getVirCardInfo(req, res, next);
    });

    app.get('/home/menu/searchEngine', function(req, res, next) {
        actionHomeMenu.searchEngine(req, res, next);
    });

    app.get('/downloadImg', function(req, res, next) {
        actionHomeMenu.downloadImg(req, res, next);
    });
    app.get('/downloadFile', function(req, res, next) {
        actionHomeMenu.downloadFile(req, res, next);
    });

    app.get('/home/common/searchCpy', (req, res, next) => {
        common.searchCpy(req, res, next);
    });

    /**
     *	前端菜单列表
     */
    app.get('/home/menu/list', function(req, res, next) {
        actionHomeMenu.list(req, res, next);
    });
    app.get('/home/menu/sourceList', function(req, res, next) {
        actionHomeMenu.sourceList(req, res, next);
    });
    app.put('/home/menu/updateSourceCfg', function(req, res, next) {
        actionHomeMenu.updateSourceCfg(req, res, next);
    });
    app.post('/home/menu/addSourceCfg', function(req, res, next) {
        actionHomeMenu.addSourceCfg(req, res, next);
    });
    app.delete('/home/menu/delSourceCfg', function(req, res, next) {
        actionHomeMenu.delSourceCfg(req, res, next);
    });

    app.put('/home/menu/updateMenuPosition', function(req, res, next) {
        actionHomeMenu.updateMenuPosition(req, res, next);
    });
    app.put('/home/menu/updateMenu', function(req, res, next) {
        actionHomeMenu.updateMenu(req, res, next);
    });
    app.post('/home/menu/addMenu', function(req, res, next) {
        actionHomeMenu.addMenu(req, res, next);
    });
    app.delete('/home/menu/delMenu', function(req, res, next) {
        actionHomeMenu.delMenu(req, res, next);
    });

    /**
     *	标记
     */
    app.post('/home/mark/add', function(req, res, next) {
        actionHomeMenu.addMark(req, res, next);
    });
    app.post('/home/mark/addBatch', function(req, res, next) {
        actionHomeMenu.addMarkBatch(req, res, next);
    });
    app.delete('/home/mark/del', function(req, res, next) {
        actionHomeMenu.cancelMark(req, res, next);
    });
    app.delete('/home/mark/delBatch', function(req, res, next) {
        actionHomeMenu.cancelMarkBatch(req, res, next);
    });
    /**
     *  附注
     */
    app.get('/home/rem/list', function(req, res, next) {
        actionHomeMenu.remList(req, res, next);
    });
    app.post('/home/rem/add', function(req, res, next) {
        actionHomeMenu.remAdd(req, res, next);
    });


    /**
     *	客户
     */
    app.get('/home/customers/list', function(req, res, next) {
        actionCustomer.list(req, res, next);
    });
    app.get('/home/customer/:targetKey', function(req, res, next) {
        actionCustomer.getTargetItem(req, res, next);
    });
    app.post('/home/customers/add', function(req, res, next) {
        actionCustomer.add(req, res, next);
    });
    app.put('/home/customers/update', function(req, res, next) {
        actionCustomer.update(req, res, next);
    });
    app.post('/home/customers/upload', function(req, res, next) {
        actionCustomer.upload(req, res, next);
    });
    app.get('/home/customers/remoteSearchCustomers', function(req, res, next) {
        actionCustomer.remoteSearchCustomers(req, res, next);
    });
    app.post('/home/customers/exportXlsx', function(req, res, next) {
        actionCustomer.exportXlsx(req, res, next);
    });
    app.get('/home/customers/getRatingHistoryList', function(req, res, next) {
        actionCustomer.getRatingHistoryList(req, res, next);
    });
    app.post('/home/customers/addRatingHistory', function(req, res, next) {
        actionCustomer.addRatingHistory(req, res, next);
    });
    app.get('/home/customers/typeDList', function(req, res, next) {
        actionCustomer.typeDList(req, res, next);
    });
    app.get('/home/customers/getAllCustomers', function(req, res, next) {
        actionCustomer.getAllCustomers(req, res, next);
    });
    const uploadDSolution = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, DIRNAME + '/downloads/d_solution/')
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        })
    });
    app.post('/home/customers/uploadDSolution/:user_id', uploadDSolution.single('files'), (req, res, next) => {
        actionCustomer.uploadDSolution(req, res, next);
    });
    app.put('/home/customers/changeDegree/:user_id', (req, res, next) => {
        actionCustomer.changeDegree(req, res, next);
    });


    /**
     *	用户
     */
    app.get('/home/users/list', function(req, res, next) {
        actionUsers.list(req, res, next);
    });
    app.post('/home/users/add', function(req, res, next) {
        actionUsers.add(req, res, next);
    });
    app.put('/home/users/update', function(req, res, next) {
        actionUsers.update(req, res, next);
    });
    app.post('/home/users/upload', function(req, res, next) {
        actionUsers.upload(req, res, next);
    });


    /**
     *	联系人
     */
    app.get('/home/contacts/list', function(req, res, next) {
        actionContacts.list(req, res, next);
    });
    app.get('/home/contact/:id([0-9]+)', function(req, res, next) {
        actionContacts.getTargetItem(req, res, next);
    });
    app.post('/home/contacts/checkAdd', function(req, res, next) {
        actionContacts.checkAdd(req, res, next);
    });
    app.post('/home/contacts/add', function(req, res, next) {
        actionContacts.add(req, res, next);
    });
    app.put('/home/contacts/update', function(req, res, next) {
        actionContacts.update(req, res, next);
    });
    app.put('/home/contacts/delContact', function(req, res, next) {
        actionContacts.delContact(req, res, next);
    });
    app.post('/home/contacts/upload', function(req, res, next) {
        actionContacts.upload(req, res, next);
    });
    app.get('/home/contacts/searchInfoByName', function(req, res, next) {
        actionContacts.searchInfoByName(req, res, next);
    });
    app.get('/home/contacts/searchInfoByKeywords', function(req, res, next) {
        actionContacts.searchInfoByKeywords(req, res, next);
    });


    /**
     *	员工
     */
    app.get('/home/staff/list', function(req, res, next) {
        actionStaff.list(req, res, next);
    });
    app.get('/home/staff/:id([0-9]+)', function(req, res, next) {
        actionStaff.getTargetItem(req, res, next);
    });
    app.get('/home/staff/getListByLevel', function(req, res, next) {
        actionStaff.getListByLevel(req, res, next);
    });
    app.get('/home/staff/all', function(req, res, next) {
        actionStaff.staffAll(req, res, next);
    });
    app.get('/home/staff/idTransToName', function(req, res, next) {
        actionStaff.idTransToName(req, res, next);
    });
    app.get('/home/staff/self', function(req, res, next) {
        actionStaff.self(req, res, next);
    });
    app.get('/home/staff/getPricingAuth', function(req, res, next) {
        actionStaff.getPricingAuth(req, res, next);
    });
    app.put('/home/staff/update', function(req, res, next) {
        actionStaff.update(req, res, next);
    });
    app.post('/home/staff/add', function(req, res, next) {
        actionStaff.add(req, res, next);
    });
    app.post('/home/staff/upload', function(req, res, next) {
        actionStaff.upload(req, res, next);
    });
    app.get('/home/staff/remoteSearchStaff', function(req, res, next) {
        actionStaff.remoteSearchStaff(req, res, next);
    });
    app.delete('/home/staff/delBatch', function(req, res, next) {
        actionStaff.delBatch(req, res, next);
    });

    /**
     *	微信会员
     */
    app.get('/home/member/list', function(req, res, next) {
        actionMember.list(req, res, next);
    });
    app.get('/home/member/:id([0-9]+)', function(req, res, next) {
        actionMember.targetItem(req, res, next);
    });
    app.delete('/home/member/delMember', function(req, res, next) {
        actionMember.delMember(req, res, next);
    });
    app.put('/home/member/recoverMember', function(req, res, next) {
        actionMember.recoverMember(req, res, next);
    });
    app.put('/home/member/subCheck', function(req, res, next) {
        actionMember.subCheck(req, res, next);
    });
    app.get('/home/member/getRegColleague', function(req, res, next) {
        actionMember.getRegColleague(req, res, next);
    });
    app.get('/home/member/getRegMemberByCompany', function(req, res, next) {
        actionMember.getRegMemberByCompany(req, res, next);
    });
    app.get('/home/member/verifiedInfoInquiry', function(req, res, next) {
        actionMember.verifiedRelation(req, res, next);
    });
    app.get('/home/member/getMemberByScoreRule', function(req, res, next) {
        actionMember.getMemberByScoreRule(req, res, next);
    });
    app.get('/home/member/trainLog', function(req, res, next) {
        actionMember.getTrainLog(req, res, next);
    });
    app.post('/home/member/trainLog', function(req, res, next) {
        actionMember.addTrainLog(req, res, next);
    });
    app.delete('/home/member/trainLog/:id([0-9]+)', function(req, res, next) {
        actionMember.delTrainLog(req, res, next);
    });
    app.post('/home/member/uploadCerImg', function(req, res, next) {
        actionMember.uploadCerImg(req, res, next);
    });
    app.get('/home/member/getActivityRecord', function(req, res, next) {
        actionMember.getActivityRecord(req, res, next);
    });
    app.delete('/home/member/delActivityRecord/:id([0-9]+)', function(req, res, next) {
        actionMember.delActivityRecord(req, res, next);
    });
    app.post('/home/member/addActivityRecord', function(req, res, next) {
        actionMember.addActivityRecord(req, res, next);
    });
    app.get('/home/member/getExchangeRecord', function(req, res, next) {
        actionMember.getExchangeRecord(req, res, next);
    });
    app.get('/home/member/getMemberScore/:open_id', function(req, res, next) {
        actionMember.getMemberScore(req, res, next);
    });
    app.post('/home/member/sendMiddleMsg', function(req, res, next) {
        actionMember.sendMiddleMsg(req, res, next);
    });
    app.get('/home/member/getMiddleMsg', function(req, res, next) {
        actionMember.getMiddleMsg(req, res, next);
    });
    app.post('/home/member/addCustomMiddleMsg', function(req, res, next) {
        actionMember.addCustomMiddleMsg(req, res, next);
    });
    app.get('/home/member/getTotalMiddleMsg', function(req, res, next) {
        actionMember.getTotalMiddleMsg(req, res, next);
    });
    app.post('/home/member/inputYBScoreByCustom', function(req, res, next) {
        actionMember.inputYBScoreByCustom(req, res, next);
    });
    app.get('/home/member/getActivityMapper', function(req, res, next) {
        actionMember.getActivityMapper(req, res, next);
    });
    app.post('/home/member/createActivity', function(req, res, next) {
        actionMember.createActivity(req, res, next);
    });
    app.delete('/home/member/deleteActivity', function(req, res, next) {
        actionMember.deleteActivity(req, res, next);
    });
    app.delete('/home/member/deleteActivityBatch', function(req, res, next) {
        actionMember.deleteActivityBatch(req, res, next);
    });
    app.post('/home/member/parseExcelPhoneForActivity', function(req, res, next) {
        actionMember.parseExcelPhoneForActivity(req, res, next);
    });
    app.get('/home/member/getScoreTicketByUid', function(req, res, next) {
        actionMember.getScoreTicketByUid(req, res, next);
    });
    app.put('/home/member/applyCheck', function(req, res, next) {
        actionMember.applyCheck(req, res, next);
    });
    app.put('/home/member/checkPass', function(req, res, next) {
        actionMember.checkPass(req, res, next);
    });
    app.put('/home/member/checkNotPass', function(req, res, next) {
        actionMember.checkNotPass(req, res, next);
    });
    app.put('/home/member/updateActivityProps', function(req, res, next) {
        actionMember.updateActivityProps(req, res, next);
    });
    app.get('/home/member/getMiniMemberListById/:id', function(req, res, next) {
        actionMember.getMiniMemberListById(req, res, next);
    });
    app.get('/home/member/getTotalYbTicket', function(req, res, next) {
        actionMember.getTotalYbTicket(req, res, next);
    });
    app.get('/home/member/getGiftList', function(req, res, next) {
        actionMember.getGiftList(req, res, next);
    });
    app.post('/home/member/createGift', function(req, res, next) {
        actionMember.createGift(req, res, next);
    });
    app.put('/home/member/updateGift', function(req, res, next) {
        actionMember.updateGift(req, res, next);
    });
    app.delete('/home/member/delGift', function(req, res, next) {
        actionMember.delGift(req, res, next);
    });
    app.get('/home/member/totalMemberList', function(req, res, next) {
        actionMember.totalMemberList(req, res, next);
    });
    app.post('/home/member/giving', function(req, res, next) {
        actionMember.giving(req, res, next);
    });
    app.get('/home/member/getUnreadMsgList', function(req, res, next) {
        actionMember.getUnreadMsgList(req, res, next);
    });
    app.put('/home/member/updateMsgHasRead', function(req, res, next) {
        actionMember.updateMsgHasRead(req, res, next);
    });
    app.post('/home/member/saveFreeExchangeRecord', function(req, res, next) {
        actionMember.saveFreeExchangeRecord(req, res, next);
    });
    app.delete('/home/member/delFreeExchangeRecord', function(req, res, next) {
        actionMember.delFreeExchangeRecord(req, res, next);
    });
    app.get('/home/member/listFreeExchange', function(req, res, next) {
        actionMember.listFreeExchange(req, res, next);
    });

    /**
     *	合同
     */
    app.get('/home/contracts/list', function(req, res, next) {
        actionContracts.list(req, res, next);
    });
    app.get('/home/contract/:targetKey', function(req, res, next) {
        actionContracts.getTargetItem(req, res, next);
    });
    app.get('/home/contractBody/:targetKey', function(req, res, next) {
        actionContracts.getTargetItemBody(req, res, next);
    });
    app.get('/home/contracts/remoteSearchForDeposit', function(req, res, next) {
        actionContracts.remoteSearchForDeposit(req, res, next);
    });
    app.post('/home/contracts/add', function(req, res, next) {
        actionContracts.add(req, res, next);
    });
    app.post('/home/contracts/addAgain', function(req, res, next) {
        actionContracts.addAgain(req, res, next);
    });
    app.put('/home/contracts/update', function(req, res, next) {
        actionContracts.update(req, res, next);
    });
    app.put('/home/contracts/turnToAllowDelivery/:contract_no', function(req, res, next) {
        actionContracts.turnToAllowDelivery(req, res, next);
    });
    app.delete('/home/contracts/del', function(req, res, next) {
        actionContracts.del(req, res, next);
    });
    app.post('/home/contracts/upload', function(req, res, next) {
        actionContracts.upload(req, res, next);
    });
    app.get('/home/contracts/getAllProductsSelected', function(req, res, next) {
        actionContracts.getAllProductsSelected(req, res, next);
    });
    app.put('/home/contracts/changeGoods', function(req, res, next) {
        actionContracts.changeGoods(req, res, next);
    });
    app.get('/home/contracts/getAmountInProvince', function(req, res, next) {
        actionContracts.getAmountInProvince(req, res, next);
    });
    app.put('/home/contracts/updateGoodsType', function(req, res, next) {
        actionContracts.updateGoodsType(req, res, next);
    });
    app.get('/home/contracts/removeVirSnToOther/:contract_no', function(req, res, next) {
        actionContracts.removeVirSnToOther(req, res, next);
    });
    app.get('/home/contracts/packingList/:id', function(req, res, next) {
        actionContracts.getPackingList(req, res, next);
    });
    app.get('/home/contracts/queryExpress/:no', function(req, res, next) {
        actionContracts.queryExpress(req, res, next);
    });
    app.put('/home/contracts/returnGoods', function(req, res, next) {
        actionContracts.returnGoods(req, res, next);
    });
    app.put('/home/contracts/subSnRem', function(req, res, next) {
        actionContracts.subSnRem(req, res, next);
    });
    app.get('/home/contracts/getAssembleDisk', function(req, res, next) {
        actionContracts.getAssembleDisk(req, res, next);
    });
    app.post('/home/contracts/createAssembleDisk', function(req, res, next) {
        actionContracts.createAssembleDisk(req, res, next);
    });
    app.post('/home/contracts/createAssembleDiskBatch', function(req, res, next) {
        actionContracts.createAssembleDiskBatch(req, res, next);
    });
    app.put('/home/contracts/changeDiskBatch', function(req, res, next) {
        actionContracts.changeDiskBatch(req, res, next);
    });
    app.get('/home/productOrder/list', function(req, res, next) {
        actionProductOrder.list(req, res, next);
    });
    app.get('/home/product/getTotalInventorySn', function(req, res, next) {
        actionProducts.getTotalInventorySn(req, res, next);
    });
    app.post('/home/productOrder/add', function(req, res, next) {
        actionProductOrder.add(req, res, next);
    });
    app.delete('/home/productOrder/del', function(req, res, next) {
        actionProductOrder.del(req, res, next);
    });
    app.post('/home/productOrder/addPack', function(req, res, next) {
        actionProductOrder.addPack(req, res, next);
    });
    app.put('/home/productOrder/updateExpressNoInPacking', function(req, res, next) {
        actionProductOrder.updateExpressNoInPacking(req, res, next);
    });

    /**
     *  定价单
     */
    app.get('/home/pricing/list', function(req, res, next) {
        actionPricing.list(req, res, next);
    });
    app.get('/home/targetPricing/:targetKey', function(req, res, next) {
        actionPricing.getTargetItem(req, res, next);
    });
    app.put('/home/pricing/update', function(req, res, next) {
        actionPricing.update(req, res, next);
    });
    app.post('/home/pricing/addGoods', function(req, res, next) {
        actionPricing.addGoods(req, res, next);
    });
    app.delete('/home/pricing/delGoods/:id', function(req, res, next) {
        actionPricing.delGoods(req, res, next);
    });
    app.put('/home/pricing/agree', function(req, res, next) {
        actionPricing.agree(req, res, next);
    });
    app.put('/home/pricing/notAgree', function(req, res, next) {
        actionPricing.notAgree(req, res, next);
    });
    app.put('/home/pricing/rebackCheck', (req, res, next) => {
        actionPricing.rebackCheck(req, res, next);
    });
    app.get('/home/pricing/getAchievementInfo', function(req, res, next) {
        actionPricing.getAchievementInfo(req, res, next);
    });
    app.get('/home/pricing/getClosedAchievementInfo', function(req, res, next) {
        actionPricing.getClosedAchievementInfo(req, res, next);
    });
    app.get('/home/pricing/getNewCusAchievementInfo', function(req, res, next) {
        actionPricing.getNewCusAchievementInfo(req, res, next);
    });
    app.get('/home/pricing/getSum', function(req, res, next) {
        actionPricing.getSum(req, res, next);
    });
    app.get('/home/pricing/newCustomerDeferred', function(req, res, next) {
        actionPricing.newCustomerDeferred(req, res, next);
    });
    app.put('/home/pricing/filterNewCustomerContractByContract', function(req, res, next) {
        actionPricing.filterNewCustomerContractByContract(req, res, next);
    });
    app.get('/home/pricing/getDeferredAchievement', function(req, res, next) {
        actionPricing.getDeferredAchievement(req, res, next);
    });
    app.get('/home/pricing/getDeferredPayable', function(req, res, next) {
        actionPricing.getDeferredPayable(req, res, next);
    });

    /**
     *  产品成本
     */
    app.get('/home/productsLibrary/list', function(req, res, next) {
        actionProductsLibrary.list(req, res, next);
    });
    app.get('/home/targetProductsLibrary/:targetKey', function(req, res, next) {
        actionProductsLibrary.getTargetItem(req, res, next);
    });
    app.post('/home/productsLibrary/add', function(req, res, next) {
        actionProductsLibrary.add(req, res, next);
    });
    app.put('/home/productsLibrary/update', function(req, res, next) {
        actionProductsLibrary.update(req, res, next);
    });
    app.delete('/home/productsLibrary/del', function(req, res, next) {
        actionProductsLibrary.del(req, res, next);
    });
    app.get('/home/productsLibrary/search', function(req, res, next) {
        actionProductsLibrary.searchProductsLibrary(req, res, next);
    });
    app.get('/home/productsLibrary/getGoodsType', function(req, res, next) {
        actionProductsLibrary.getGoodsType(req, res, next);
    });
    app.get('/home/productsLibrary/getServerPriceMap', function(req, res, next) {
        actionProductsLibrary.getServerPriceMap(req, res, next);
    });
    app.patch('/home/productsLibrary/updateCount/:id', function(req, res, next) {
        actionProductsLibrary.updateCount(req, res, next);
    });
    app.get('/home/productsLibrary/getWorkHoursChartData', function(req, res, next) {
        actionProductsLibrary.getWorkHoursChartData(req, res, next);
    });
    app.get('/home/productsLibrary/getDerredData', function(req, res, next) {
        actionProductsLibrary.getDerredData(req, res, next);
    });

    /**
     *	维修
     */
    app.get('/home/repairs/list', function(req, res, next) {
        actionRepairs.list(req, res, next);
    });
    app.get('/home/repairs/getOneById/:id', function(req, res, next) {
        actionRepairs.getOneById(req, res, next);
    });
    app.get('/home/repairs/searchHistory', function(req, res, next) {
        actionRepairs.searchHistory(req, res, next);
    });
    app.put('/home/repairs/update', function(req, res, next) {
        actionRepairs.update(req, res, next);
    });
    app.get('/home/repairs/searchCnAbb', function(req, res, next) {
        actionRepairs.searchCnAbb(req, res, next);
    });
    app.post('/home/repairs/add', function(req, res, next) {
        actionRepairs.add(req, res, next);
    });
    app.delete('/home/repairs/del', function(req, res, next) {
        actionRepairs.del(req, res, next);
    });
    app.post('/home/repairs/upload', function(req, res, next) {
        actionRepairs.upload(req, res, next);
    });
    app.get('/home/repairs/getRepairRateByYear', function(req, res, next) {
        actionRepairs.getRepairRateByYear(req, res, next);
    });
    app.patch('/home/repairs/updateRem', function(req, res, next) {
        actionRepairs.updateRem(req, res, next);
    });
    app.put('/home/repairs/toFirstCheck', function(req, res, next) {
        actionRepairs.toFirstCheck(req, res, next);
    });
    app.put('/home/repairs/toRepairing', function(req, res, next) {
        actionRepairs.toRepairing(req, res, next);
    });
    app.put('/home/repairs/toSecondCheck', function(req, res, next) {
        actionRepairs.toSecondCheck(req, res, next);
    });
    app.put('/home/repairs/toPrepareSend', function(req, res, next) {
        actionRepairs.toPrepareSend(req, res, next);
    });
    app.put('/home/repairs/toHasSend', function(req, res, next) {
        actionRepairs.toHasSend(req, res, next);
    });
    app.put('/home/repairs/toHasReceive', function(req, res, next) {
        actionRepairs.toHasReceive(req, res, next);
    });
    app.get('/home/repairs/getRepairRateData', function(req, res, next) {
        actionRepairs.getRepairRateData(req, res, next);
    });
    app.get('/home/repairs/getRepairMsg', function(req, res, next) {
        actionRepairs.getRepairMsg(req, res, next);
    });
    app.post('/home/repairs/addRepairMsg', function(req, res, next) {
        actionRepairs.addRepairMsg(req, res, next);
    });

    /**
     *	发货记录
     */
    app.get('/home/output/list', function(req, res, next) {
        actionOutput.list(req, res, next);
    });
    app.get('/home/output/:targetKey([0-9]+)', function(req, res, next) {
        actionOutput.getTargetItem(req, res, next);
    });
    app.put('/home/output/update', function(req, res, next) {
        actionOutput.update(req, res, next);
    });
    app.post('/home/output/add', function(req, res, next) {
        actionOutput.add(req, res, next);
    });
    app.get('/home/output/searchCpy', function(req, res, next) {
        actionOutput.searchCpy(req, res, next);
    });
    app.get('/home/output/searchNo', function(req, res, next) {
        actionOutput.searchNo(req, res, next);
    });

    /**
     *  物品
     */
    app.get('/home/g/:numbering', function(req, res, next) {
        actionGoods.targetItem(req, res, next);
    });
    app.get('/home/goods/list', function(req, res, next) {
        actionGoods.list(req, res, next);
    });
    app.get('/home/targetGood/:targetKey', function(req, res, next) {
        actionGoods.getTargetItem(req, res, next);
    });
    app.get('/home/goods/getGoodsNumAndAmount', function(req, res, next) {
        actionGoods.getGoodsNumAndAmount(req, res, next);
    });
    app.put('/home/goods/update', function(req, res, next) {
        actionGoods.update(req, res, next);
    });
    app.delete('/home/goods/del', function(req, res, next) {
        actionGoods.del(req, res, next);
    });
    // app.post('/home/goods/add', function(req, res, next) {
    // 	actionGoods.add(req,res,next);
    // });
    app.post('/home/goods/upload', function(req, res, next) {
        actionGoods.upload(req, res, next);
    });

    app.put('/home/goods/applyBorrow', function(req, res, next) {
        actionGoods.applyBorrow(req, res, next);
    });
    app.put('/home/goods/agreeBorrow', function(req, res, next) {
        actionGoods.agreeBorrow(req, res, next);
    });
    app.put('/home/goods/notAggreBorrow', function(req, res, next) {
        actionGoods.notAggreBorrow(req, res, next);
    });
    app.put('/home/goods/applyBack', function(req, res, next) {
        actionGoods.applyBack(req, res, next);
    });
    app.put('/home/goods/aggreBack', function(req, res, next) {
        actionGoods.aggreBack(req, res, next);
    });

    app.get('/home/goods/searchStaff', function(req, res, next) {
        actionGoods.searchStaff(req, res, next);
    });
    app.get('/home/goods/downloadNotUpdateImg', function(req, res, next) {
        actionGoods.downloadNotUpdateImg(req, res, next);
    });

    /**
     *  联系单
     */
    app.get('/home/order/list', function(req, res, next) {
        actionOrder.list(req, res, next);
    });
    app.put('/home/order/update', function(req, res, next) {
        actionOrder.update(req, res, next);
    });
    app.get('/home/order/getTags', function(req, res, next) {
        actionOrder.getTags(req, res, next);
    });
    app.get('/home/order/getTagHash', function(req, res, next) {
        hybridOrder.getTagHash(req, res, next);
    });
    app.put('/home/order/closeOrder', function(req, res, next) {
        hybridOrder.closeOrder(req, res, next);
    });
    app.get('/home/order/getUserStatusInfo', function(req, res, next) {
        actionOrder.getUserStatusInfo(req, res, next);
    });
    app.get('/home/contactOrder/:id([0-9]+)', function(req, res, next) {
        actionOrder.getTargetOrder(req, res, next);
    });

    /**
     *  到账
     */
    app.get('/home/payment/list', function(req, res, next) {
        actionPayments.list(req, res, next);
    });
    app.get('/home/payment/searchContractNo', function(req, res, next) {
        actionPayments.searchContractNo(req, res, next);
    });
    app.get('/home/targetPayment/:id', function(req, res, next) {
        actionPayments.targetPaymentItem(req, res, next);
    });
    app.delete('/home/payment/:id', function(req, res, next) {
        actionPayments.deletePayment(req, res, next);
    });
    app.delete('/home/payUse/:id', function(req, res, next) {
        actionPayments.deletePayUse(req, res, next);
    });
    app.post('/home/payment/add', function(req, res, next) {
        actionPayments.paymentAdd(req, res, next);
    });
    app.post('/home/payUse/add', function(req, res, next) {
        actionPayments.payUseAdd(req, res, next);
    });

    /**
     *  考勤
     */
    app.get('/home/attendance/dateList', function(req, res, next) {
        actionAttendance.dateList(req, res, next);
    });
    app.post('/home/attendance/addDateList', function(req, res, next) {
        actionAttendance.addDateList(req, res, next);
    });
    app.get('/home/attendance/workingNum', function(req, res, next) {
        actionAttendance.workingNum(req, res, next);
    });
    app.get('/home/attendance/checkSign', function(req, res, next) {
        actionAttendance.checkSign(req, res, next);
    });
    app.get('/home/attendance/sign', function(req, res, next) {
        actionAttendance.sign(req, res, next);
    });
    app.get('/home/attendance/leave', function(req, res, next) {
        actionAttendance.leave(req, res, next);
    });
    app.put('/home/attendance/goOut', function(req, res, next) {
        actionAttendance.goOut(req, res, next);
    });
    app.put('/home/attendance/outBack', function(req, res, next) {
        actionAttendance.outBack(req, res, next);
    });
    app.put('/home/attendance/outLeave', function(req, res, next) {
        actionAttendance.outLeave(req, res, next);
    });
    app.put('/home/attendance/overWork', function(req, res, next) {
        actionAttendance.overWork(req, res, next);
    });
    app.put('/home/attendance/endOverWork', function(req, res, next) {
        actionAttendance.endOverWork(req, res, next);
    });
    app.post('/home/attendance/applyAbsence', function(req, res, next) {
        actionAttendance.applyAbsence(req, res, next);
    });
    app.post('/home/attendance/upload', function(req, res, next) {
        actionAttendance.upload(req, res, next);
    });
    app.get('/home/attendance/getAllMonthData', function(req, res, next) {
        actionAttendance.getAllMonthData(req, res, next);
    });
    app.delete('/home/attendance/recall', function(req, res, next) {
        actionAttendance.recall(req, res, next);
    });
    app.delete('/home/attendance/recallOverWork', function(req, res, next) {
        actionAttendance.recallOverWork(req, res, next);
    });
    app.get('/home/attendance/getOverWorkData', function(req, res, next) {
        actionAttendance.getOverWorkData(req, res, next);
    });
    app.get('/home/attendance/directorGetOverWorkData', function(req, res, next) {
        actionAttendance.directorGetOverWorkData(req, res, next);
    });
    app.put('/home/attendance/checkOverWorkOrder', function(req, res, next) {
        actionAttendance.checkOverWorkOrder(req, res, next);
    });
    app.put('/home/attendance/rateOverWork', function(req, res, next) {
        actionAttendance.rateOverWork(req, res, next);
    });
    app.put('/home/attendance/updateOverWork', function(req, res, next) {
        actionAttendance.updateOverWork(req, res, next);
    });
    app.get('/home/overwork/:id([0-9]+)', function(req, res, next) {
        actionAttendance.targetOverWorkItem(req, res, next);
    });
    app.get('/home/attendance/getAllStaffAllMonthData', function(req, res, next) {
        actionAttendance.getAllStaffAllMonthData(req, res, next);
    });
    app.get('/home/attendance/applyDuty', function(req, res, next) {
        actionAttendance.applyDuty(req, res, next);
    });
    app.put('/home/attendance/cancelApplyDuty', function(req, res, next) {
        actionAttendance.cancelApplyDuty(req, res, next);
    });
    app.get('/home/attendance/applyCusDuty', function(req, res, next) {
        actionAttendance.applyCusDuty(req, res, next);
    });
    app.put('/home/attendance/cancelApplyCusDuty', function(req, res, next) {
        actionAttendance.cancelApplyCusDuty(req, res, next);
    });
    app.get('/home/attendance/applyInsideDuty', function(req, res, next) {
        actionAttendance.applyInsideDuty(req, res, next);
    });
    app.put('/home/attendance/cancelInsideDuty', function(req, res, next) {
        actionAttendance.cancelInsideDuty(req, res, next);
    });
    app.put('/home/attendance/signGps', function(req, res, next) {
        actionAttendance.signGps(req, res, next);
    });
    app.put('/home/attendance/overWorkGps', function(req, res, next) {
        actionAttendance.overWorkGps(req, res, next);
    });
    app.post('/home/attendance/hybridSafeDuty', function(req, res, next) {
        actionAttendance.hybridSafeDuty(req, res, next);
    });
    app.post('/home/attendance/hybridCusDuty', function(req, res, next) {
        actionAttendance.hybridCusDuty(req, res, next);
    });
    app.post('/home/attendance/hybridInsideDuty', function(req, res, next) {
        actionAttendance.hybridInsideDuty(req, res, next);
    });
    app.get('/home/attendance/onlineAssessment', function(req, res, next) {
        actionAttendance.onlineAssessment(req, res, next);
    });
    app.get('/home/attendance/getHasMobileStaffArr', function(req, res, next) {
        actionAttendance.getHasMobileStaffArr(req, res, next);
    });
    app.get('/home/attendance/getTargetEvent', function(req, res, next) {
        actionAttendance.getTargetEvent(req, res, next);
    });

    /**
     *  钱包
     */
    app.get('/home/wallet/list', (req, res, next) => {
        actionWallet.list(req, res, next);
    });
    app.post('/home/wallet/printCoup', (req, res, next) => {
        actionWallet.printCoup(req, res, next);
    });
    app.get('/home/wallet/bankCoupList', (req, res, next) => {
        actionWallet.bankCoupList(req, res, next);
    });
    app.get('/home/targetWallet/:user_id', (req, res, next) => {
        actionWallet.getTargetItem(req, res, next);
    });
    app.post('/home/wallet/addCoup', (req, res, next) => {
        actionWallet.addCoup(req, res, next);
    });
    app.delete('/home/wallet/delCoup', (req, res, next) => {
        actionWallet.delCoup(req, res, next);
    });
    app.get('/home/wallet/remoteSearchCouponNo', (req, res, next) => {
        actionWallet.remoteSearchCouponNo(req, res, next);
    });
    app.get('/home/wallet/calculYearCoup', function(req, res, next) {
        actionWallet.calculYearCoup(req, res, next);
    });
    app.post('/home/wallet/createYearCoup', function(req, res, next) {
        actionWallet.createYearCoup(req, res, next);
    });
    // 弃用
    app.post('/home/wallet/createCouponByExcel', function(req, res, next) {
        actionWallet.createCouponByExcel(req, res, next);
    });
    app.post('/home/wallet/assignCouponByUserId', function(req, res, next) {
        actionWallet.assignCouponByUserId(req, res, next);
    });
    app.get('/home/wallet/getTargetCoupLog/:coupon_no', function(req, res, next) {
        actionWallet.getTargetCoupLog(req, res, next);
    });
    app.get('/home/wallet/getTargetDepoLog/:contract_no', function(req, res, next) {
        actionWallet.getTargetDepoLog(req, res, next);
    });

    /**
     *  事务
     */
    //例行事务新增
    app.post('/home/respoAffair/add', (req, res, next) => {
        actionAffairs.respoAffairAdd(req, res, next);
    });
    //项目事务新增
    app.post('/home/projectAffair/add', (req, res, next) => {
        actionAffairs.projectAffairAdd(req, res, next);
    });
    //小事务新增
    app.post('/home/smallAffair/add', (req, res, next) => {
        actionAffairs.smallAffairAdd(req, res, next);
    });
    //事务列表
    app.get('/home/affair/list', (req, res, next) => {
        actionAffairs.affairList(req, res, next);
    });
    //事务列表（供筛选）
    app.get('/home/affair/listForSelect', (req, res, next) => {
        actionAffairs.listForSelect(req, res, next);
    });
    // 改变进度
    app.put('/home/affair/changeDegree', (req, res, next) => {
        actionAffairs.changeDegree(req, res, next);
    });
    //指定事务,不包括关联事务和被关联事务
    app.get('/home/getTargetAffair/:affairId', (req, res, next) => {
        actionAffairs.getTargetAffair(req, res, next);
    });
    //指定事务,包括关联事务和被关联事务
    app.get('/home/getTargetAffairSupAndSub/:affairId', (req, res, next) => {
        actionAffairs.getTargetAffairSupAndSub(req, res, next);
    });
    //删除指定事务
    app.delete('/home/deleteTargetAffair/:affairId', (req, res, next) => {
        actionAffairs.deleteTargetAffair(req, res, next);
    });
    //普通父类事务的更新
    app.put('/home/affair/update', (req, res, next) => {
        actionAffairs.affairUpdate(req, res, next);
    });
    //改变事务成员（例行事务）
    app.put('/home/affair/changeTeamMember', (req, res, next) => {
        actionAffairs.changeTeamMember(req, res, next);
    });
    //改变事务成员（立项事务）
    app.put('/home/affair/changeProjectTeamMember', (req, res, next) => {
        actionAffairs.changeProjectTeamMember(req, res, next);
    });
    //改变例行事务的子字段
    app.put('/home/respoAffair/update', (req, res, next) => {
        actionAffairs.respoAffairUpdate(req, res, next);
    });
    //改变小事务的子字段
    app.put('/home/smallAffair/update', (req, res, next) => {
        actionAffairs.smallAffairUpdate(req, res, next);
    });
    //改变项目事务的子字段
    app.put('/home/projectAffair/update', (req, res, next) => {
        actionAffairs.projectAffairUpdate(req, res, next);
    });
    //改变项目事务的子字段的项目进展
    app.put('/home/childProjectAffair/update', (req, res, next) => {
        actionAffairs.childProjectAffairUpdate(req, res, next);
    });
    //改变事务的排序
    app.put('/home/affair/changeViewOrder', (req, res, next) => {
        actionAffairs.changeViewOrder(req, res, next);
    });
    //点击关注或取关
    app.put('/home/affair/attentionAffair', (req, res, next) => {
        actionAffairs.attentionAffair(req, res, next);
    });

    /******************************************************************************************/

    //新增邮件
    app.post('/home/notiClient/add', (req, res, next) => {
        actionNotiSystem.notiClientAdd(req, res, next);
    });
    //撤回邮件
    app.put('/home/notiClient/recall', (req, res, next) => {
        actionNotiSystem.notiClientRecall(req, res, next);
    });
    //上传图片
    app.post('/home/notiClient/imgUpload', function(req, res, next) {
        actionNotiSystem.imgUpload(req, res, next);
    });
    //上传文件
    app.post('/home/notiClient/fileUpload', function(req, res, next) {
        actionNotiSystem.fileUpload(req, res, next);
    });
    //获取邮件列表
    app.get('/home/notiClient/list', (req, res, next) => {
        actionNotiSystem.notiClientList(req, res, next);
    });
    //获取指定邮件
    app.get('/home/notiMail/:mailId', (req, res, next) => {
        actionNotiSystem.getTargetMail(req, res, next);
    });
    //获取指定事务资源
    app.get('/home/notiClient/getResourse', (req, res, next) => {
        actionNotiSystem.getResourse(req, res, next);
    });
    //邮件主体更新（幂等）
    app.put('/home/notiClient/update', (req, res, next) => {
        actionNotiSystem.notiClientUpdate(req, res, next);
    });
    //追加回复
    app.post('/home/notiClient/addReply', (req, res, next) => {
        actionNotiSystem.addReply(req, res, next);
    });
    //转发消息
    app.post('/home/notiClient/forwardMsg', (req, res, next) => {
        actionNotiSystem.forwardMsg(req, res, next);
    });
    //邮件回执更新（幂等）
    app.put('/home/notiClient/subUpdate', (req, res, next) => {
        actionNotiSystem.notiClientSubUpdate(req, res, next);
    });
    //来自邮局的更新（事先在邮局的注册表中注册过）
    app.put('/home/notiClient/fromNotiPostUpdate', (req, res, next) => {
        actionNotiSystem.fromNotiPostUpdate(req, res, next);
    });

    app.post('/home/notiClient/notiSaleman', (req, res, next) => {
        actionNotiSystem.notiSaleman(req, res, next);
    });

    //来自通知中心的更新，需重定向
    app.put('/home/notiPost/fromCenterUpdate', function(req, res, next) {
        actionNotiSystem.fromCenterUpdate(req, res, next);
    });
    //来自通知中心的更新reply，需重定向
    app.put('/home/notiPost/fromCenterUpdateReply', function(req, res, next) {
        actionNotiSystem.fromCenterUpdateReply(req, res, next);
    });
    //来自通知中心的get，需重定向
    app.get('/home/notiPost/fromCenterList', function(req, res, next) {
        actionNotiSystem.fromCenterList(req, res, next);
    });

    //获取消息盒子内容
    app.get('/home/msgBox/list', function(req, res, next) {
        actionNotiSystem.msgBoxList(req, res, next);
    });

    // 获取最迟发言时间
    app.get('/home/affair/fetchDeadLine', (req, res, next) => {
        actionNotiSystem.fetchDeadLine(req, res, next);
    });

    // 消息转移
    app.put('/home/affair/transferMsg', (req, res, next) => {
        actionNotiSystem.transferMsg(req, res, next);
    });



    // 项目版本管理
    app.get('/home/softProject/getListByUpdateTime', function(req, res, next) {
        actionSoftProject.getListByUpdateTime(req, res, next);
    });
    app.get('/home/softProject/getClsList', function(req, res, next) {
        actionSoftProject.getClsList(req, res, next);
    });
    app.get('/home/softProject/getListByProjectTitle', function(req, res, next) {
        actionSoftProject.getListByProjectTitle(req, res, next);
    });
    app.put('/home/softProject/isStar', function(req, res, next) {
        actionSoftProject.isStar(req, res, next);
    });
    app.get('/home/softProject/developList', function(req, res, next) {
        actionSoftProject.developList(req, res, next);
    });
    app.get('/home/softProject/getListByDevelop', function(req, res, next) {
        actionSoftProject.getListByDevelop(req, res, next);
    });
    app.get('/home/softProject/getVersionListById', function(req, res, next) {
        actionSoftProject.getVersionListById(req, res, next);
    });
    app.get('/home/softProject/getPropertyBySoftProjectId', function(req, res, next) {
        actionSoftProject.getPropertyBySoftProjectId(req, res, next);
    });
    app.post('/home/softProject/createProject', function(req, res, next) {
        actionSoftProject.createProject(req, res, next);
    });
    app.put('/home/softProject/updateProjectProperty', function(req, res, next) {
        actionSoftProject.updateProjectProperty(req, res, next);
    });
    app.post('/home/softProject/pushNewVersion', function(req, res, next) {
        actionSoftProject.pushNewVersion(req, res, next);
    });
    app.put('/home/softProject/recoverVersion', function(req, res, next) {
        actionSoftProject.recoverVersion(req, res, next);
    });
    app.put('/home/softProject/recoverChildVersion', function(req, res, next) {
        actionSoftProject.recoverChildVersion(req, res, next);
    });
    app.post('/home/softProject/createTestReport', function(req, res, next) {
        actionSoftProject.createTestReport(req, res, next);
    });
    app.put('/home/softProject/changeRelease', function(req, res, next) {
        actionSoftProject.changeRelease(req, res, next);
    });
    app.put('/home/softProject/changeTestStatus', function(req, res, next) {
        actionSoftProject.changeTestStatus(req, res, next);
    });
    app.post('/home/softProject/uploadProjectFile', function(req, res, next) {
        actionSoftProject.uploadProjectFile(req, res, next);
    });
    app.get('/home/softProject/getFilePropsByName', function(req, res, next) {
        actionSoftProject.getFilePropsByName(req, res, next);
    });
    app.get('/home/softProject/getAllProjectName', function(req, res, next) {
        actionSoftProject.getAllProjectName(req, res, next);
    });
    app.post('/home/softProject/leaveMessage', function(req, res, next) {
        actionSoftProject.leaveMessage(req, res, next);
    });
    app.get('/home/softProject/getTotalOpenSoft', function(req, res, next) {
        actionSoftProject.getTotalOpenSoft(req, res, next);
    });
    app.post('/home/softProject/pushNewChildVersion', function(req, res, next) {
        actionSoftProject.pushNewChildVersion(req, res, next);
    });
    app.get('/videoPage', function(req, res, next) {
        res.sendFile(DIRNAME + '/public/html/webrtc.html');
    });
    app.get('/home/webrtcHostMapper', (req, res, next) => {
        const hostArr = [],
            guestArr = [];
        for (let key in global.socketMapper) {
            if (global.socketMapper[key].type == 'host') {
                hostArr.push(key);
            } else {
                guestArr.push(key);
            }
        }
        res.send({
            code: 200,
            msg: '',
            data: {
                hostArr,
                guestArr
            }
        });
    });

    // 知识库
    app.get('/home/knowlib/getKnowledgeTree', (req, res, next) => {
        actionFileSys.getKnowledgeTree(req, res, next);
    });
    app.post('/home/knowlib/addKnowledgeTree', (req, res, next) => {
        actionFileSys.addKnowledgeTree(req, res, next);
    });
    app.delete('/home/knowlib/delKnowledgeTree', (req, res, next) => {
        actionFileSys.delKnowledgeTree(req, res, next);
    });
    app.put('/home/knowlib/renameTree', (req, res, next) => {
        actionFileSys.renameTree(req, res, next);
    });
    app.put('/home/knowlib/removeTree', (req, res, next) => {
        actionFileSys.removeTree(req, res, next);
    });
    app.put('/home/knowlib/dragNodeIn', (req, res, next) => {
        actionFileSys.dragNodeIn(req, res, next);
    });
    app.get('/home/knowlib/getFileList', (req, res, next) => {
        actionFileSys.getFileList(req, res, next);
    });
    app.post('/home/knowlib/createDoc', (req, res, next) => {
        actionFileSys.createDoc(req, res, next);
    });
    app.put('/home/knowlib/changeTreeId', (req, res, next) => {
        actionFileSys.changeTreeId(req, res, next);
    });
    app.put('/home/knowlib/renameFile', (req, res, next) => {
        actionFileSys.renameFile(req, res, next);
    });
    app.delete('/home/knowlib/delFile', (req, res, next) => {
        actionFileSys.delFile(req, res, next);
    });
    app.put('/home/knowlib/editFileContent', (req, res, next) => {
        actionFileSys.editFileContent(req, res, next);
    });
    app.get('/home/knowlib/getFileContent', (req, res, next) => {
        actionFileSys.getFileContent(req, res, next);
    });
    app.get('/home/knowlib/searchFile', (req, res, next) => {
        actionFileSys.searchFile(req, res, next);
    });
    app.post('/home/knowlib/parseExcel', (req, res, next) => {
        actionFileSys.parseExcel(req, res, next);
    });
    app.post('/home/knowlib/copyFile', (req, res, next) => {
        actionFileSys.copyFile(req, res, next);
    });
    app.put('/home/knowlib/editFileHead', (req, res, next) => {
        actionFileSys.editFileHead(req, res, next);
    });
    app.put('/home/knowlib/subEdit', (req, res, next) => {
        actionFileSys.subEdit(req, res, next);
    });
    app.put('/home/knowlib/fileMark', (req, res, next) => {
        actionFileSys.fileMark(req, res, next);
    });
    app.put('/home/knowlib/fileImportant', (req, res, next) => {
        actionFileSys.fileImportant(req, res, next);
    });
    app.get('/home/knowlib/getGalleryGroup', (req, res, next) => {
        actionFileSys.getGalleryGroup(req, res, next);
    });
    app.get('/home/knowlib/getGalleryGroupItem', (req, res, next) => {
        actionFileSys.getGalleryGroupItem(req, res, next);
    });
    app.post('/home/knowlib/createGalleryGroup', (req, res, next) => {
        actionFileSys.createGalleryGroup(req, res, next);
    });
    app.delete('/home/knowlib/delGalleryGroup', (req, res, next) => {
        actionFileSys.delGalleryGroup(req, res, next);
    });
    app.put('/home/knowlib/galleryMark', (req, res, next) => {
        actionFileSys.galleryMark(req, res, next);
    });
    app.put('/home/knowlib/changeGalleryInfo', (req, res, next) => {
        actionFileSys.changeGalleryInfo(req, res, next);
    });
    app.put('/home/knowlib/changeAlbum', (req, res, next) => {
        actionFileSys.changeAlbum(req, res, next);
    });
    app.get('/home/knowlib/getShootingList', (req, res, next) => {
        actionFileSys.getShootingList(req, res, next);
    });
    app.get('/home/knowlib/getShootingItem', (req, res, next) => {
        actionFileSys.getShootingItem(req, res, next);
    });

    // 图库多图片上传
    const uploadAlbum = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, DIRNAME + '/public/img/gallery')
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        })
    });
    app.post('/home/knowlib/uploadAlbum', uploadAlbum.array('files'), (req, res, next) => {
        actionFileSys.uploadAlbum(req, res, next);
    });

    /***************************************************************************************/
    app.get('/home/knowlib/docList', (req, res, next) => {
        actionFileSys.docList(req, res, next);
    });
    app.get('/home/knowlib/fetchSourceByAffairId', (req, res, next) => {
        actionFileSys.fetchSourceByAffairId(req, res, next);
    });
    // 文档上传
    const uploadDoc = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, DIRNAME + '/downloads/temp/')
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        })
    });
    app.post('/home/knowlib/addDoc', uploadDoc.single('files'), (req, res, next) => {
        actionFileSys.addDoc(req, res, next);
    });
    app.post('/home/knowlib/uploadTempDoc', uploadDoc.single('files'), (req, res, next) => {
        actionFileSys.uploadTempDoc(req, res, next);
    });
    app.put('/home/knowlib/updateDocInfo', (req, res, next) => {
        actionFileSys.updateDocInfo(req, res, next);
    });
    app.delete('/home/knowlib/delDoc', (req, res, next) => {
        actionFileSys.delDoc(req, res, next);
    });
    app.put('/home/knowlib/docMark', (req, res, next) => {
        actionFileSys.docMark(req, res, next);
    });
    app.put('/home/knowlib/docSetImportant', (req, res, next) => {
        actionFileSys.docSetImportant(req, res, next);
    });
    app.put('/home/knowlib/gallerySetImportant', (req, res, next) => {
        actionFileSys.gallerySetImportant(req, res, next);
    });
    app.put('/home/knowlib/replaceFile', (req, res, next) => {
        actionFileSys.replaceFile(req, res, next);
    });
    app.get('/home/knowlib/getFileHistoryList', (req, res, next) => {
        actionFileSys.getFileHistoryList(req, res, next);
    });
    app.put('/home/knowlib/pushFile', (req, res, next) => {
        actionFileSys.pushFile(req, res, next);
    });
    app.post('/home/knowlib/pipeToDoc', (req, res, next) => {
        actionFileSys.pipeToDoc(req, res, next);
    });
    app.get('/home/knowlib/recycleBinId', (req, res, next) => {
        res.send({ data: CONFIG.recycleBinId });
    });
    app.put('/home/knowlib/recycleBinRollback', (req, res, next) => {
        actionFileSys.recycleBinRollback(req, res, next);
    });
    app.put('/home/knowlib/recycleBinGalleryRollback', (req, res, next) => {
        actionFileSys.recycleBinGalleryRollback(req, res, next);
    });
    app.put('/home/knowlib/recycleBinDocRollback', (req, res, next) => {
        actionFileSys.recycleBinDocRollback(req, res, next);
    });


    app.get('/home/publicRelationShip', (req, res, next) => {
        actionPublicRelationShip.getList(req, res, next);
    });
    app.get('/home/publicRelationShip/:user_id([0-9]+)', (req, res, next) => {
        actionPublicRelationShip.getTarget(req, res, next);
    });
    app.post('/home/publicRelationShip', (req, res, next) => {
        actionPublicRelationShip.create(req, res, next);
    });
    app.put('/home/publicRelationShip/:user_id([0-9]+)', (req, res, next) => {
        actionPublicRelationShip.update(req, res, next);
    });
    app.delete('/home/publicRelationShip/:user_id([0-9]+)', (req, res, next) => {
        actionPublicRelationShip.destroy(req, res, next);
    });

    app.get('/home/buyer', (req, res, next) => {
        actionBuyer.getList(req, res, next);
    });
    app.get('/home/buyer/:user_id([0-9]+)', (req, res, next) => {
        actionBuyer.getTarget(req, res, next);
    });
    app.post('/home/buyer', (req, res, next) => {
        actionBuyer.create(req, res, next);
    });
    app.put('/home/buyer/:user_id([0-9]+)', (req, res, next) => {
        actionBuyer.update(req, res, next);
    });
    app.delete('/home/buyer/:user_id([0-9]+)', (req, res, next) => {
        actionBuyer.destroy(req, res, next);
    });

    app.get('/home/endUser', (req, res, next) => {
        actionEndUser.getList(req, res, next);
    });
    app.get('/home/endUser/:user_id([0-9]+)', (req, res, next) => {
        actionEndUser.getTarget(req, res, next);
    });
    app.post('/home/endUser', (req, res, next) => {
        actionEndUser.create(req, res, next);
    });
    app.put('/home/endUser/:user_id([0-9]+)', (req, res, next) => {
        actionEndUser.update(req, res, next);
    });
    app.delete('/home/endUser/:user_id([0-9]+)', (req, res, next) => {
        actionEndUser.destroy(req, res, next);
    });

    app.get('/home/verUnit', (req, res, next) => {
        actionVerUnit.getList(req, res, next);
    });
    app.get('/home/verUnit/:user_id([0-9]+)', (req, res, next) => {
        actionVerUnit.getTarget(req, res, next);
    });
    app.put('/home/verUnit/:user_id([0-9]+)', (req, res, next) => {
        actionVerUnit.update(req, res, next);
    });

    app.get('/home/smsTemp/getReceiver', (req, res, next) => {
        actionSmsTemp.getReceiver(req, res, next);
    });
    app.get('/home/smsTemp/getTemp', (req, res, next) => {
        actionSmsTemp.getTemp(req, res, next);
    });
    app.get('/home/smsTemp/getLog', (req, res, next) => {
        actionSmsTemp.getLog(req, res, next);
    });
    app.post('/home/smsTemp/sendSms', (req, res, next) => {
        actionSmsTemp.sendSms(req, res, next);
    });

    /********************************* 20200903 模板部分 *****************************************/
    // 按试验机厂家分类
    app.get('/home/action/factoryModel', (req, res, next) => {
        actionVir.sortByFactory(req, res, next);
    });
    // 按适用方案分类
    app.get('/home/action/solutionType', (req, res, next) => {
        actionVir.sortBySolution(req, res, next);
    });
    // 新增模板
    const uploadVirPublicCfg = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, DIRNAME + '/downloads/temp/')
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        })
    });
    app.post('/home/vir/parsePublicCfg', uploadVirPublicCfg.single('files'), (req, res, next) => {
        actionVir.parsePublicCfg(req, res, next);
    });
    // 威程配置模板列表
    app.get('/home/vir/tempList', (req, res, next) => {
        actionVir.tempList(req, res, next);
    });
    // 新增实例时，选择的模板列表
    app.get('/home/vir/tempNameList', (req, res, next) => {
        actionVir.tempNameList(req, res, next);
    });
    // 模板更新后，重新获取用
    app.get('/home/vir/targetTemp', (req, res, next) => {
        actionVir.targetTemp(req, res, next);
    });
    // 模板更新
    app.put('/home/vir/updateTemp', (req, res, next) => {
        actionVir.updateTemp(req, res, next);
    });
    // 删除模板
    app.delete('/home/vir/deleteTemp', (req, res, next) => {
        actionVir.deleteTemp(req, res, next);
    });
    /********************************* 20200903 实例部分 *************************************/
    // 威程控制器创建实例
    app.post('/home/vir/createInstance/:name', (req, res, next) => {
        actionVir.createInstance(req, res, next);
    });


    app.get('/home/virProducts', (req, res, next) => {
        actionProducts.index(req, res, next);
    });
    app.get('/home/virProducts/:id([0-9]+)', (req, res, next) => {
        actionProducts.show(req, res, next);
    });
    app.get('/home/virProducts/showBySn/:sn([0-9]+)', (req, res, next) => {
        actionProducts.showBySn(req, res, next);
    });
    app.delete('/home/virProducts/:id([0-9]+)', (req, res, next) => {
        actionProducts.destroy(req, res, next);
    });
    app.put('/home/virProducts/:id([0-9]+)', (req, res, next) => {
        actionProducts.update(req, res, next);
    });
    app.put('/home/virProducts/scrapped/:id([0-9]+)', (req, res, next) => {
        actionProducts.scrapped(req, res, next);
    });
    app.get('/home/virProducts/getRegHistory/:sn([0-9]+)', (req, res, next) => {
        actionProducts.getRegHistory(req, res, next);
    });
    app.get('/home/virProducts/getApp/:id([0-9]+)', (req, res, next) => {
        actionProducts.getApp(req, res, next);
    });
    app.put('/home/virProducts/addApp', (req, res, next) => {
        actionProducts.addApp(req, res, next);
    });
    app.put('/home/virProducts/delApp', (req, res, next) => {
        actionProducts.delApp(req, res, next);
    });
    app.get('/home/virProducts/getVirtualList', (req, res, next) => {
        actionProducts.getVirtualList(req, res, next);
    });

    app.get('/home/virProducts/showApplyList', (req, res, next) => {
        actionSnCreateTool.index(req, res, next);
    });
    app.post('/home/virProducts/applySn', (req, res, next) => {
        actionSnCreateTool.create(req, res, next);
    });
    app.post('/home/virProducts/postCardFromClient', (req, res, next) => {
        actionProducts.postCardFromClient(req, res, next);
    });
    app.get('/home/virProducts/remoteSearchUserId', (req, res, next) => {
        actionProducts.remoteSearchUserId(req, res, next);
    });
    app.post('/home/virProducts/addJudgeRecord', (req, res, next) => {
        actionProducts.addJudgeRecord(req, res, next);
    });
    app.post('/home/virProducts/addResaleRecord', (req, res, next) => {
        actionProducts.addResaleRecord(req, res, next);
    });
    app.post('/home/virProducts/addCtrlInfo', (req, res, next) => {
        actionProducts.addCtrlInfo(req, res, next);
    });
    app.post('/home/otherProducts/add', (req, res, next) => {
        actionProducts.otherProducts.add(req, res, next);
    });
    app.post('/home/otherProducts/edit/:id', (req, res, next) => {
        actionProducts.otherProducts.edit(req, res, next);
    });
    app.delete('/home/otherProducts/del/:id', (req, res, next) => {
        actionProducts.otherProducts.del(req, res, next);
    });
    app.get('/home/otherProducts/getList', (req, res, next) => {
        actionProducts.otherProducts.getList(req, res, next);
    });
    app.post('/home/otherProducts/uploadAlbum', (req, res, next) => {
        actionProducts.otherProducts.uploadAlbum(req, res, next);
    });

    app.get('/home/solutionTree/getTree', (req, res, next) => {
        actionSolutionTree.getTree(req, res, next);
    });
    app.post('/home/solutionTree/addNode', (req, res, next) => {
        actionSolutionTree.addNode(req, res, next);
    });
    app.delete('/home/solutionTree/delNode', (req, res, next) => {
        actionSolutionTree.delNode(req, res, next);
    });
    app.put('/home/solutionTree/renameNode', (req, res, next) => {
        actionSolutionTree.renameNode(req, res, next);
    });
    app.put('/home/solutionTree/removeTree', (req, res, next) => {
        actionSolutionTree.removeTree(req, res, next);
    });
    app.put('/home/solutionTree/dragNodeIn', (req, res, next) => {
        actionSolutionTree.dragNodeIn(req, res, next);
    });

    app.get('/home/businessTrip/list', (req, res, next) => {
        actionBusinessTrip.getList(req, res, next);
    });
    app.get('/home/businessTrip/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.getTarget(req, res, next);
    });
    app.put('/home/businessTrip/agree', (req, res, next) => {
        actionBusinessTrip.agree(req, res, next);
    });
    app.put('/home/businessTrip/disagree', (req, res, next) => {
        actionBusinessTrip.disagree(req, res, next);
    });
    app.put('/home/businessTrip/changeAmount', (req, res, next) => {
        actionBusinessTrip.changeAmount(req, res, next);
    });
    app.put('/home/businessTrip/update', (req, res, next) => {
        actionBusinessTrip.update(req, res, next);
    });
    app.put('/home/businessTrip/applyExpenseBatch', (req, res, next) => {
        actionBusinessTrip.applyExpenseBatch(req, res, next);
    });
    app.post('/home/businessTrip/add', (req, res, next) => {
        actionBusinessTrip.add(req, res, next);
    });
    app.delete('/home/businessTrip/del', (req, res, next) => {
        actionBusinessTrip.del(req, res, next);
    });
    app.get('/home/businessTrip/remoteSearchMeetOrder', (req, res, next) => {
        actionBusinessTrip.remoteSearchMeetOrder(req, res, next);
    });
    app.get('/home/businessTrip/meetOrderList', (req, res, next) => {
        actionBusinessTrip.meetOrderList(req, res, next);
    });
    app.put('/home/businessTrip/meetOrder/normalAgree/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.meetOrderNormalAgree(req, res, next);
    });
    app.put('/home/businessTrip/meetOrder/normalDisAgree/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.meetOrderNormalDisAgree(req, res, next);
    });
    app.put('/home/businessTrip/meetOrder/agree/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.meetOrderAgree(req, res, next);
    });
    app.put('/home/businessTrip/meetOrder/disAgree/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.meetOrderDisAgree(req, res, next);
    });
    app.put('/home/businessTrip/meetOrder/changeWorkTime/:id([0-9]+)', (req, res, next) => {
        actionBusinessTrip.meetOrderchangeWorkTime(req, res, next);
    });
    app.get('/home/businessTrip/contactsOrderAssessment', (req, res, next) => {
        actionBusinessTrip.contactsOrderAssessment(req, res, next);
    });
    app.get('/home/business/getOnlineContactRecord', (req, res, next) => {
        actionBusinessTrip.getOnlineContactRecord(req, res, next);
    });
    app.put('/home/business/updateContractNoBySn', (req, res, next) => {
        actionBusinessTrip.updateContractNoBySn(req, res, next);
    });
    app.get('/home/business/getTotalMeetMsgTime', (req, res, next) => {
        actionBusinessTrip.getTotalMeetMsgTime(req, res, next);
    });
    app.get('/home/business/getImageListByContactTime', (req, res, next) => {
        actionBusinessTrip.getImageListByContactTime(req, res, next);
    });

    app.get('/home/simuCtrl/getSolutionList', (req, res, next) => {
        actionSimuCtrl.getSolutionList(req, res, next);
    });
    app.get('/home/simuCtrl/getModelListBySolution', (req, res, next) => {
        actionSimuCtrl.getModelListBySolution(req, res, next);
    });
    app.get('/home/simuCtrl/getAtsListBySolution', (req, res, next) => {
        actionSimuCtrl.getAtsListBySolution(req, res, next);
    });
    app.get('/home/simuCtrl/getSimuList', (req, res, next) => {
        actionSimuCtrl.getSimuList(req, res, next);
    });
    app.post('/home/simuCtrl/createSimuInstance', (req, res, next) => {
        actionSimuCtrl.createSimuInstance(req, res, next);
    });

    app.get('/home/vehicleRegist/getList', (req, res, next) => {
        actionVehicleRegist.getList(req, res, next);
    });

    app.post('/home/cloudDisk/batchCreate', (req, res, next) => {
        actionCloudDisk.batchCreate(req, res, next);
    });
    app.get('/home/cloudDisk/getListByUpdateTime', (req, res, next) => {
        actionCloudDisk.getListByUpdateTime(req, res, next);
    });
    app.get('/home/cloudDisk/download/:fileId', (req, res, next) => {
        actionCloudDisk.downloadFile(req, res, next);
    });
    app.get('/home/cloudDisk/download/:fileId/:picId', (req, res, next) => {
        actionCloudDisk.downloadFile(req, res, next);
    });
    app.delete('/home/cloudDisk/del/:fileId', (req, res, next) => {
        actionCloudDisk.del(req, res, next);
    });
    app.put('/home/cloudDisk/star', (req, res, next) => {
        actionCloudDisk.star(req, res, next);
    });


    app.get('/home/burnDisk/getList', (req, res, next) => {
        actionCloudDisk.getList(req, res, next);
    });
    app.get('/home/burnDisk/targetBurnDisk/:_id', (req, res, next) => {
        actionCloudDisk.getTargetBurnDisk(req, res, next);
    });
    app.delete('/home/burnDisk/targetBurnDisk/:_id', (req, res, next) => {
        actionCloudDisk.deleteTargetBurnDisk(req, res, next);
    });
    app.get('/home/burnDisk/getRootInstallPackList', (req, res, next) => {
        actionCloudDisk.getRootInstallPackList(req, res, next);
    });
    app.post('/home/burnDisk/createPackageTable', (req, res, next) => {
        actionCloudDisk.createPackageTable(req, res, next);
    });
    app.post('/home/burnDisk/copyPackageTable', (req, res, next) => {
        actionCloudDisk.copyPackageTable(req, res, next);
    });
    app.put('/home/burnDisk/updateInfo', (req, res, next) => {
        actionCloudDisk.updateInfo(req, res, next);
    });
    app.get('/home/burnDisk/getDependenciesList', (req, res, next) => {
        actionCloudDisk.getDependenciesList(req, res, next);
    });
    app.put('/home/burnDisk/updateDependenciesToLatest', (req, res, next) => {
        actionCloudDisk.updateDependenciesToLatest(req, res, next);
    });
    app.post('/home/burnDisk/buildSoft/:sn([0-9]+)', (req, res, next) => {
        actionCloudDisk.buildSoftBySn(req, res, next);
    });
    app.post('/home/burnDisk/buildSoft/:_id', (req, res, next) => {
        actionCloudDisk.buildSoft(req, res, next);
    });
    app.post('/home/burnDisk/buildDependency/:_id', (req, res, next) => {
        actionCloudDisk.buildDependency(req, res, next);
    });

    app.post('/home/seckill/createSeckillOrder', (req, res, next) => {
        actionSeckill.createSeckillOrder(req, res, next);
    });
    app.delete('/home/seckill/delSeckillOrder/:order_id', (req, res, next) => {
        actionSeckill.delSeckillOrder(req, res, next);
    });
    app.put('/home/seckill/updateSeckillOrder', (req, res, next) => {
        actionSeckill.updateSeckillOrder(req, res, next);
    });
    app.get('/home/seckill/listSeckill', (req, res, next) => {
        actionSeckill.listSeckill(req, res, next);
    });
}