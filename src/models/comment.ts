import sequelize from "@/service/sequelize.js";
import { DataTypes, Model, type BelongsToGetAssociationMixin } from "sequelize";
import User from "./user.js";
import Incident from "./incident.js";
import { AVAILABLE_STATUSES } from "@/enum/status.js";
import type Status from "./status.js";

class Comment extends Model {
  declare id: number;
  declare userId: number;
  declare incidentId: number;
  declare comment: string;
  declare status: Status;

  declare getUser: BelongsToGetAssociationMixin<User>;
  declare getIncident: BelongsToGetAssociationMixin<Incident>;
}

Comment.init(
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
    incidentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Incident,
        key: "id",
      },
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...AVAILABLE_STATUSES),
      allowNull: false,
    },
  },
  { sequelize, tableName: "comments", modelName: "comment" },
);

export default Comment;
