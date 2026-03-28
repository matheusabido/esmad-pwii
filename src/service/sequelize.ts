import { Sequelize } from "sequelize";
import logger from "./logger.js";

const sequelize = new Sequelize(
  `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`,
  {
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    logging: (msg) => logger.debug(msg),
  },
);

export default sequelize;
