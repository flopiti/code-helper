import express from "express";
import {
  buildRestCall,
  createNewResource,
  AddHasManyRelationshipBase,
  processResources,
} from "./functions";
const router = express.Router();

router.get("/add-request", async (req, res) => {
  const resources = await processResources(req.query.projectPath);
  console.log("All Resources:", JSON.stringify(resources, null, 2));
  if (resources && resources.length > 0 && resources[0].files.length > 1) {
    buildRestCall(
      "GET",
      resources[0].name,
      { description: "one" },
      resources[0].files[1],
    );
  }
  res.status(200).json({ message: "received" });
});

router.post("/create-new-resource/:id", (req: any, res) => {
  const { id } = req.params;
  createNewResource(id, req.body.data);
  res.status(200).json({ message: "received" });
});

router.post("/has-many", (req: any, res) => {
  hasMany(req.body.data);
  res.status(200).json({ message: "received" });
});

export default router;
