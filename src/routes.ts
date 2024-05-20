import express from "express";
import {
  buildRestCall,
  createNewResource,
  AddHasManyRelationshipBase,
  processResources,
} from "./functions";
const router = express.Router();

router.post("/create-new-resource/:id", (req: any, res) => {
  const { id } = req.params;
  createNewResource(id, req.body.data);
  res.status(200).json({ message: "received" });
});

router.post("/has-many", (req: any, res) => {
  AddHasManyRelationshipBase(req.body.data);
  res.status(200).json({ message: "received" });
});

router.get(`/spring-boot-classes`, async (req: any, res) => { 
  console.log("spring-boot-classes")
  const response = await processResources();
  console.log(response)
  res.status(200).json(response);
}
);

export default router;
