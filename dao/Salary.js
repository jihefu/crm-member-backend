'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Salary', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.INTEGER,
            comment: '工号'
        },
        user_name: {
            type: DataTypes.STRING,
            comment: '姓名'
        },
        basic_salary: {
            type: DataTypes.INTEGER,
            comment: '月发基本工资'
        },
        performance_salary: {
            type: DataTypes.INTEGER,
            comment: '绩效工资'
        },
        news: {
            type: DataTypes.INTEGER,
            comment: '通讯'
        },
        meal: {
            type: DataTypes.INTEGER,
            comment: '餐补'
        },
        overtime: {
            type: DataTypes.INTEGER,
            comment: '加班'
        },
        bussiness_trip: {
            type: DataTypes.INTEGER,
            comment: '出差'
        },
        service: {
            type: DataTypes.INTEGER,
            comment: '服务'
        },
        duty_day: {
            type: DataTypes.INTEGER,
            comment: '值日'
        },
        high_temperature: {
            type: DataTypes.INTEGER,
            comment: '高温费'
        },
        tax_back: {
            type: DataTypes.INTEGER,
            comment: '个税返还'
        },
        absence: {
            type: DataTypes.INTEGER,
            comment: '缺勤'
        },
        affair_not_update: {
            type: DataTypes.INTEGER,
            comment: '系统未更新'
        },
        provident_fund_supplement: {
            type: DataTypes.INTEGER,
            comment: '公积金补充'
        },
        repay: {
            type: DataTypes.INTEGER,
            comment: '归还借款'
        },
        new_customer: {
            type: DataTypes.INTEGER,
            comment: '新客户'
        },
        drawback: {
            type: DataTypes.DECIMAL(11,2),
            comment: '退税奖'
        },
        year_end_awards: {
            type: DataTypes.INTEGER,
            comment: '年终奖'
        },
        should_pay: {
            type: DataTypes.INTEGER,
            comment: '应发工资'
        },
        social_security: {
            type: DataTypes.FLOAT,
            comment: '社保'
        },
        provident_fund: {
            type: DataTypes.FLOAT,
            comment: '公积金'
        },
        salary_personal_tax: {
            type: DataTypes.FLOAT,
            comment: '工资个税'
        },
        year_end_awards_personal_tax: {
            type: DataTypes.FLOAT,
            comment: '年终奖个税'
        },
        actual_pay: {
            type: DataTypes.FLOAT,
            comment: '实发工资'
        },
        enterprise_social_security: {
            type: DataTypes.FLOAT,
            comment: '社保'
        },
        enterprise_provident_fund: {
            type: DataTypes.FLOAT,
            comment: '公积金'
        },
        additional_person: {
            type: DataTypes.STRING,
            comment: '代收人'
        },
        y_m_salary: {
            type: DataTypes.STRING,
            comment: '工资发放日期'
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'salary',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
