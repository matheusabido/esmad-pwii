import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";

class Status extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
  declare color: string;
}

Status.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, tableName: "statuses", modelName: "status" },
);

export default Status;
