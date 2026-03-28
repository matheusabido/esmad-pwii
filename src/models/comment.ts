import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";
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

Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
Comment.belongsTo(Incident, { foreignKey: "incidentId", as: "incident" });

export default Comment;
