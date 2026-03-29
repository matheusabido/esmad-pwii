import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";
import Incident from "./incident.js";

class IncidentPicture extends Model {
  declare id: number;
  declare incidentId: number;
  declare pictureUrl: string;
  declare title: string;
  declare description: string;
}

IncidentPicture.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    incidentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Incident,
        key: "id",
      },
    },
    pictureUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, tableName: "incident_pictures", modelName: "incident_picture" },
);

export default IncidentPicture;
