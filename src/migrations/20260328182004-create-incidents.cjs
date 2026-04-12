"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (tx) => {
      await queryInterface.createTable(
        "incidents",
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          shortDescription: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          buildingId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "buildings",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          location: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          priority: {
            type: Sequelize.ENUM("low", "medium", "high"),
            allowNull: true,
          },
          statusId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "statuses",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: "categories",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
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
        { transaction: tx },
      );

      await queryInterface.addIndex("incidents", ["priority"], {
        transaction: tx,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("incidents");
  },
};
