import { AVAILABLE_ROLES } from "@/enum/role.js";
import { AVAILABLE_STATUSES, type Status } from "@/enum/status.js";
import sequelize from "@/service/sequelize.js";
import { DataTypes, Model, type HasManyGetAssociationsMixin } from "sequelize";
import bcrypt from "bcrypt";
import type Incident from "./incident.js";
import type Comment from "./comment.js";

class User extends Model {
  declare id: number;
  declare email: string;
  declare name: string;
  declare status: Status;
  declare role: string;
  declare password: string;

  declare getIncidents: HasManyGetAssociationsMixin<Incident>;
  declare getComments: HasManyGetAssociationsMixin<Comment>;
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

export default User;
