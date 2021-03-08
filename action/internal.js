const serviceMember = require('../service/member');

exports.consumeYBScore = async (req, res, next) => {
    const { unionid, goodsId } = req.body;
    const result = await serviceMember.consumeYBScore({ unionid, goodsId, notNotify: true });
    res.send(result);
}