"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        "users",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM("pending", "rejected", "active", "inactive"),
            allowNull: false,
          },
          role: {
            type: Sequelize.ENUM("admin", "student", "employee"),
            allowNull: false,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction: t },
      );

      await queryInterface.addIndex("users", ["email"], {
        unique: true,
        transaction: t,
      });

      await queryInterface.addIndex("users", ["status"], {
        transaction: t,
      });

      await queryInterface.addIndex("users", ["role"], {
        transaction: t,
      });
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
