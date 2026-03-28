import sequelize from "@/service/sequelize.js";
import { DataTypes, Model } from "sequelize";

class Category extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
  declare color: string;
}

Category.init(
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
  { sequelize, tableName: "categories", modelName: "category" },
);

export default Category;
