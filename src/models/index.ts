import Building from "./building.js";
import Category from "./category.js";
import Comment from "./comment.js";
import Incident from "./incident.js";
import IncidentPicture from "./incident_picture.js";
import Status from "./status.js";
import User from "./user.js";

export async function associateModels() {
  Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
  Comment.belongsTo(Incident, { foreignKey: "incidentId", as: "incident" });

  IncidentPicture.belongsTo(Incident, {
    foreignKey: "incidentId",
    as: "incident",
  });

  Incident.belongsTo(User, { foreignKey: "userId", as: "user" });
  Incident.belongsTo(Building, { foreignKey: "buildingId", as: "building" });
  Incident.belongsTo(Status, { foreignKey: "statusId", as: "status" });
  Incident.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
  Incident.hasMany(IncidentPicture, {
    foreignKey: "incidentId",
    as: "pictures",
  });

  User.hasMany(Incident, { foreignKey: "userId", as: "incidents" });
  User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
}
