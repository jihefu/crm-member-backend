'use strict';

var sequelize = require('./_db').sequelize();
var BaseMsg = sequelize.import('./BaseMsg.js');
var CallMsg = sequelize.import('./CallMsg.js');
var Products = sequelize.import('./Products.js');
var Repairs = sequelize.import('./Repairs.js');
var Staff = sequelize.import('./Staff.js');
var Salary = sequelize.import('./Salary.js');
var Tags = sequelize.import('./Tags.js');
var Member = sequelize.import('./Member.js');
var Customers = sequelize.import('./Customers.js');
var Users = sequelize.import('./Users.js');
var RegEvent = sequelize.import('./RegEvent.js');
var AppNameLib = sequelize.import('./AppNameLib.js');
var MemberMsg = sequelize.import('./MemberMsg.js');
var ItemScore = sequelize.import('./ItemScore.js');
var MemberScore = sequelize.import('./MemberScore.js');
var MemberSignScore = sequelize.import('./MemberSignScore.js');
var ContractsHead = sequelize.import('./ContractsHead.js');
var ContractsBody = sequelize.import('./ContractsBody.js');
var PackingList = sequelize.import('./PackingList.js');
var SignActivity = sequelize.import('./SignActivity.js');
var SignScore = sequelize.import('./SignScore.js');
var CreditRecords = sequelize.import('./CreditRecords.js');
var Payment = sequelize.import('./Payment.js');
var AnnualPayment = sequelize.import('./AnnualPayment.js');
var Contacts = sequelize.import('./Contacts.js');
var ServiceTagsLib = sequelize.import('./ServiceTagsLib.js');
var PayUse = sequelize.import('./PayUse.js');
var CreditTrendTecord = sequelize.import('./CreditTrendTecord.js');
var Menu = sequelize.import('./Menu.js');
var DeliveryRecord = sequelize.import('./DeliveryRecord.js');
var InfoMark = sequelize.import('./InfoMark.js');
var Goods = sequelize.import('./Goods.js');
var GoodsBorrowRecords = sequelize.import('./GoodsBorrowRecords.js');
var goodsScanLog = sequelize.import('./goodsScanLog.js');
var AttendanceDate = sequelize.import('./AttendanceDate.js');
var StaffSign = sequelize.import('./StaffSign.js');
var StaffSignLog = sequelize.import('./StaffSignLog.js');
var StaffOutLog = sequelize.import('./StaffOutLog.js');
var StaffOverWork = sequelize.import('./StaffOverWork.js');
var StaffAbsenceReason = sequelize.import('./StaffAbsenceReason.js');
var OnDuty = sequelize.import('./OnDuty.js');
var RemList = sequelize.import('./RemList.js');

var Affair = sequelize.import('./Affair.js');
var RespoAffair = sequelize.import('./RespoAffair.js');
var ProjectAffair = sequelize.import('./ProjectAffair.js');
var ProjectAffairProgress = sequelize.import('./ProjectAffairProgress.js');
var SmallAffair = sequelize.import('./SmallAffair.js');
var NotiClient = sequelize.import('./NotiClient.js');
var NotiClientSub = sequelize.import('./NotiClientSub.js');
var NotiPost = sequelize.import('./NotiPost.js');
var NotiPostSub = sequelize.import('./NotiPostSub.js');

var CompanyCalendar = sequelize.import('./CompanyCalendar.js');
var MsgBox = sequelize.import('./MsgBox.js');
var ContractsOffer = sequelize.import('./ContractsOffer.js');

var PricingList = sequelize.import('./PricingList.js');
var PricingListGoods = sequelize.import('./PricingListGoods.js');
var PricingListGoodsAmount = sequelize.import('./PricingListGoodsAmount.js');
var ProductsLibrary = sequelize.import('./ProductsLibrary.js');

var ProductsSelectLog = sequelize.import('./ProductsSelectLog.js');
var ProductsSpecLog = sequelize.import('./ProductsSpecLog.js');

var Wallet = sequelize.import('./Wallet.js');
var WalletCoup = sequelize.import('./WalletCoup.js');
var WalletDepo = sequelize.import('./WalletDepo.js');
var WalletLogs = sequelize.import('./WalletLogs.js');
var WalletCoupBank = sequelize.import('./WalletCoupBank.js');
var AppUserStatus = sequelize.import('./AppUserStatus.js');

var ProgressUpdateRecord = sequelize.import('./ProgressUpdateRecord.js');

const CustomerSign = sequelize.import('./CustomerSign.js');
const CustomerMsg = sequelize.import('./CustomerMsg.js');

const SoftProject = sequelize.import('./SoftProject.js');
const SoftVersion = sequelize.import('./SoftVersion.js');
const SoftEvaluation = sequelize.import('./SoftEvaluation.js');

const CustomersStarList = sequelize.import('./CustomersStarList.js');

const YearCouponIsCreated = sequelize.import('./YearCouponIsCreated.js');
const KnowledgeTree = sequelize.import('./KnowledgeTree.js');
const FileManage = sequelize.import('./FileManage.js');
const Gallery = sequelize.import('./Gallery.js');
const GallerySub = sequelize.import('./GallerySub.js');
const DocLib = sequelize.import('./DocLib.js');

const BaseEvent = sequelize.import('./BaseEvent.js');
const TreeIdToAffairId = sequelize.import('./TreeIdToAffairId.js');

const EndUser = sequelize.import('./EndUser.js');
const Buyer = sequelize.import('./Buyer.js');
const PublicRelationShip = sequelize.import('./PublicRelationShip.js');
const VerUnit = sequelize.import('./VerUnit.js');
const SmsTemp = sequelize.import('./SmsTemp.js');
const SmsReceiver = sequelize.import('./SmsReceiver.js');
const SmsLog = sequelize.import('./SmsLog.js');

const SuitableProductList = sequelize.import('./SuitableProductList.js');
const MachineType = sequelize.import('./MachineType.js');

const MemberTrainLog = sequelize.import('./MemberTrainLog.js');
const MeetMsg = sequelize.import('./MeetMsg.js');
const OtherMsg = sequelize.import('./OtherMsg.js');
const BusinessTrip = sequelize.import('./BusinessTrip.js');
const SnCreateTool = sequelize.import('./SnCreateTool.js');
const VerContacts = sequelize.import('./VerContacts.js');
const VerUnitTel = sequelize.import('./VerUnitTel.js');
const TypeDInfo = sequelize.import('./TypeDInfo.js');
const OnlineContactsInfo = sequelize.import('./OnlineContactsInfo.js');
const VirWarranty = sequelize.import('./VirWarranty.js');

const DocLibList = sequelize.import('./DocLibList.js');
const VirtualProducts = sequelize.import('./VirtualProducts.js');
const PvUvRecord = sequelize.import('./PvUvRecord.js');

const BankCoup = sequelize.import('./BankCoup.js');
const BankCoupLog = sequelize.import('./BankCoupLog.js');
const BankDepo = sequelize.import('./BankDepo.js');
const BankDepoLog = sequelize.import('./BankDepoLog.js');
const BankMemberScore = sequelize.import('./BankMemberScore.js');
const RepairMsg = sequelize.import('./RepairMsg.js');
const OtherProducts = sequelize.import('./OtherProducts.js');
const SimuProducts = sequelize.import('./SimuProducts.js');

const GoodsForYBScore = sequelize.import('./GoodsForYBScore.js');
const ExchangeRecord = sequelize.import('./ExchangeRecord.js');

const MemberActivityMapper = sequelize.import('./MemberActivityMapper.js');

const VehicleRegist = sequelize.import('./VehicleRegist.js');

const AssembleDiskPacking = sequelize.import('./AssembleDiskPacking.js');

const ProductOrder = sequelize.import('./ProductOrder.js');

const FreeExchangeGift = sequelize.import('./FreeExchangeGift.js');

const Seckill = sequelize.import('./Seckill.js');

// 建立模型之间的关系
ContractsHead.hasMany(ContractsOffer);
ContractsOffer.belongsTo(ContractsHead);

BaseMsg.hasMany(CallMsg,{foreignKey:'base_msg_id', targetKey:'id'});
CallMsg.belongsTo(BaseMsg);

Goods.hasMany(GoodsBorrowRecords);
GoodsBorrowRecords.belongsTo(Goods);

StaffSign.hasMany(StaffSignLog);
StaffSignLog.belongsTo(StaffSign);
StaffSign.hasMany(StaffOutLog);
StaffOutLog.belongsTo(StaffSign);
StaffSign.hasMany(StaffOverWork);
StaffOverWork.belongsTo(StaffSign);
StaffSign.hasMany(StaffAbsenceReason);
StaffAbsenceReason.belongsTo(StaffSign);

Affair.hasMany(RespoAffair);
Affair.hasMany(ProjectAffair);
Affair.hasMany(SmallAffair);
RespoAffair.belongsTo(Affair);
ProjectAffair.belongsTo(Affair);
SmallAffair.belongsTo(Affair);
ProjectAffair.hasMany(ProjectAffairProgress);
ProjectAffairProgress.belongsTo(ProjectAffair);
Affair.hasMany(NotiClient);
NotiClient.belongsTo(Affair);
NotiClient.hasMany(NotiClientSub);
NotiClientSub.belongsTo(NotiClient);

NotiPost.hasMany(NotiPostSub);
NotiPostSub.belongsTo(NotiPost);

PricingList.hasMany(PricingListGoods);
PricingListGoods.belongsTo(PricingList);
PricingListGoods.hasMany(PricingListGoodsAmount);
PricingListGoodsAmount.belongsTo(PricingListGoods);

ProductsSelectLog.hasMany(ProductsSpecLog);
ProductsSpecLog.belongsTo(ProductsSelectLog);

Wallet.hasMany(WalletCoup);
WalletCoup.belongsTo(Wallet);
Wallet.hasMany(WalletDepo);
WalletDepo.belongsTo(Wallet);
Wallet.hasMany(WalletLogs);
WalletLogs.belongsTo(Wallet);

SoftProject.hasMany(SoftVersion);
SoftVersion.hasMany(SoftEvaluation);
SoftVersion.belongsTo(SoftProject);
SoftEvaluation.belongsTo(SoftVersion);

Gallery.hasMany(GallerySub);
GallerySub.belongsTo(Gallery);

BankCoup.hasMany(BankCoupLog);
BankCoupLog.belongsTo(BankCoup);

BankDepo.hasMany(BankDepoLog);
BankDepoLog.belongsTo(BankDepo);

// ContractsHead.hasMany(ContractsBody,{foreignKey:'contract_id', targetKey:'id'});
// ContractsBody.belongsTo(ContractsHead);
// User.hasMany(UserAddress, {foreignKey:'user_id', targetKey:'id', as:'Address'});
// User.belongsToMany(Role, {through: 'userRoles', as:'UserRoles'});
// Role.belongsToMany(User, {through: 'userRoles', as:'UserRoles'});

// 同步模型到数据库中
// sequelize.sync({force: false});

exports.sequelize = sequelize;

exports.BaseMsg = BaseMsg;
exports.CallMsg = CallMsg;
exports.Staff = Staff;
exports.Salary = Salary;
exports.Tags = Tags;
exports.Member = Member;
exports.Customers = Customers;
exports.Users = Users;
exports.Products = Products;
exports.Repairs = Repairs;
exports.RegEvent = RegEvent;
exports.AppNameLib = AppNameLib;
exports.MemberMsg = MemberMsg;
exports.ItemScore = ItemScore;
exports.MemberScore = MemberScore;
exports.MemberSignScore = MemberSignScore;
exports.ContractsHead = ContractsHead;
exports.ContractsBody = ContractsBody;
exports.PackingList = PackingList;
exports.SignActivity = SignActivity;
exports.SignScore = SignScore;
exports.CreditRecords = CreditRecords;
exports.Payment = Payment;
exports.AnnualPayment = AnnualPayment;
exports.Contacts = Contacts;
exports.ServiceTagsLib = ServiceTagsLib;
exports.CreditTrendTecord = CreditTrendTecord;
exports.Menu = Menu;
exports.PayUse = PayUse;
exports.DeliveryRecord = DeliveryRecord;
exports.InfoMark = InfoMark;
exports.Goods = Goods;
exports.GoodsBorrowRecords = GoodsBorrowRecords;
exports.goodsScanLog = goodsScanLog;
exports.AttendanceDate = AttendanceDate;
exports.StaffSign = StaffSign;
exports.StaffSignLog = StaffSignLog;
exports.StaffOutLog = StaffOutLog;
exports.StaffOverWork = StaffOverWork;
exports.StaffAbsenceReason = StaffAbsenceReason;
exports.OnDuty = OnDuty;

exports.Affair = Affair;
exports.RespoAffair = RespoAffair;
exports.ProjectAffair = ProjectAffair;
exports.ProjectAffairProgress = ProjectAffairProgress;
exports.SmallAffair = SmallAffair;
exports.NotiClient = NotiClient;
exports.NotiClientSub = NotiClientSub;
exports.NotiPost = NotiPost;
exports.NotiPostSub = NotiPostSub;

exports.RemList = RemList;
exports.CompanyCalendar = CompanyCalendar;
exports.MsgBox = MsgBox;
exports.ContractsOffer = ContractsOffer;

exports.PricingList = PricingList;
exports.PricingListGoods = PricingListGoods;
exports.PricingListGoodsAmount = PricingListGoodsAmount;
exports.ProductsLibrary = ProductsLibrary;

exports.ProductsSelectLog = ProductsSelectLog;
exports.ProductsSpecLog = ProductsSpecLog;

exports.Wallet = Wallet;
exports.WalletCoup = WalletCoup;
exports.WalletDepo = WalletDepo;
exports.WalletLogs = WalletLogs;
exports.WalletCoupBank = WalletCoupBank;
exports.AppUserStatus = AppUserStatus;
exports.ProgressUpdateRecord = ProgressUpdateRecord;
exports.CustomerSign = CustomerSign;
exports.CustomerMsg = CustomerMsg;

exports.SoftProject = SoftProject;
exports.SoftVersion = SoftVersion;
exports.SoftEvaluation = SoftEvaluation;
exports.CustomersStarList = CustomersStarList;
exports.YearCouponIsCreated = YearCouponIsCreated;
exports.KnowledgeTree = KnowledgeTree;
exports.FileManage = FileManage;
exports.Gallery = Gallery;
exports.GallerySub = GallerySub;
exports.DocLib = DocLib;
exports.DocLibList = DocLibList;

exports.BaseEvent = BaseEvent;
exports.TreeIdToAffairId = TreeIdToAffairId;

exports.EndUser = EndUser;
exports.Buyer = Buyer;
exports.PublicRelationShip = PublicRelationShip;
exports.VerUnit = VerUnit;
exports.SmsTemp = SmsTemp;
exports.SmsReceiver = SmsReceiver;

exports.SmsLog = SmsLog;

exports.SuitableProductList = SuitableProductList;
exports.MachineType = MachineType;
exports.MemberTrainLog = MemberTrainLog;
exports.MeetMsg = MeetMsg;
exports.OtherMsg = OtherMsg;
exports.BusinessTrip = BusinessTrip;
exports.SnCreateTool = SnCreateTool;
exports.VerContacts = VerContacts;
exports.VerUnitTel = VerUnitTel;

exports.TypeDInfo = TypeDInfo;
exports.OnlineContactsInfo = OnlineContactsInfo;
exports.VirWarranty = VirWarranty;
exports.VirtualProducts = VirtualProducts;
exports.PvUvRecord = PvUvRecord;

exports.BankCoup = BankCoup;
exports.BankCoupLog = BankCoupLog;
exports.BankDepo = BankDepo;
exports.BankDepoLog = BankDepoLog;
exports.BankMemberScore = BankMemberScore;
exports.RepairMsg = RepairMsg;
exports.OtherProducts = OtherProducts;
exports.SimuProducts = SimuProducts;

exports.GoodsForYBScore = GoodsForYBScore;
exports.ExchangeRecord = ExchangeRecord;

exports.MemberActivityMapper = MemberActivityMapper;

exports.VehicleRegist = VehicleRegist;
exports.AssembleDiskPacking = AssembleDiskPacking;

exports.ProductOrder = ProductOrder;

exports.FreeExchangeGift = FreeExchangeGift;

exports.Seckill = Seckill;