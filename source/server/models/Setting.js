module.exports = function(sequelize, Sequalize) {
    var Setting = sequelize.define("Setting", {
        wallet: Sequalize.STRING,
        key: Sequalize.STRING,
        contract: Sequalize.STRING
    },{
        timestamps: false
    });
    Setting.associate = function(models) {
        // associations can be defined here
      };
    return Setting;
}