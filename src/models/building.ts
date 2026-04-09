import { AVAILABLE_STATUSES, type Status } from "@/enum/status.js";
import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";

class Building extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
  declare status: Status;
  declare area: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

Building.init(
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
    status: {
      type: DataTypes.ENUM(...AVAILABLE_STATUSES),
      allowNull: false,
    },
    area: {
      type: DataTypes.GEOMETRY("POLYGON", 4326),
      allowNull: false,
    },
  },
  { sequelize, tableName: "buildings", modelName: "building" },
);

export default Building;
