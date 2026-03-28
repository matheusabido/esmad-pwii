import { AVAILABLE_ROLES } from "@/enum/role.js";
import { AVAILABLE_STATUSES } from "@/enum/status.js";
import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";
import bcrypt from "bcrypt";
import type Status from "./status.js";
import Incident from "./incident.js";
import Comment from "./comment.js";

class User extends Model {
  declare id: number;
  declare email: string;
  declare name: string;
  declare status: Status;
  declare role: string;
  declare password: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        min: 3,
      },
    },
    password: {
      type: DataTypes.STRING(60),
      allowNull: false,
      set(value: string) {
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue("password", hashedPassword);
      },
    },
    status: {
      type: DataTypes.ENUM(...AVAILABLE_STATUSES),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...AVAILABLE_ROLES),
      allowNull: false,
    },
  },
  { sequelize, tableName: "users", modelName: "user" },
);

User.hasMany(Incident, { foreignKey: "userId", as: "incidents" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });

export default User;
