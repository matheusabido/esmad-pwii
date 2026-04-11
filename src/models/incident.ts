import sequelize from "@/service/sequelize.js";
import {
  DataTypes,
  Model,
  type BelongsToGetAssociationMixin,
  type HasManyGetAssociationsMixin,
} from "sequelize";
import User from "./user.js";
import Building from "./building.js";
import { AVAILABLE_PRIORITIES, type Priority } from "@/enum/priority.js";
import Status from "./status.js";
import Category from "./category.js";
import type IncidentPicture from "./incident_picture.js";

class Incident extends Model {
  declare id: number;
  declare userId: number;
  declare shortDescription: string;
  declare description: string;
  declare buildingId: number;
  declare location: string;
  declare priority?: Priority;
  declare statusId?: number;
  declare categoryId: number;

  declare getPictures: HasManyGetAssociationsMixin<IncidentPicture>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare getBuilding: BelongsToGetAssociationMixin<Building>;
  declare getStatus: BelongsToGetAssociationMixin<Status>;
  declare getCategory: BelongsToGetAssociationMixin<Category>;
}

Incident.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    buildingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Building,
        key: "id",
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...AVAILABLE_PRIORITIES),
      allowNull: true,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Status,
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
    },
  },
  { sequelize, tableName: "incidents", modelName: "incident" },
);

export default Incident;
