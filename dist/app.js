import fs from "fs/promises";
import path from "path";
import { readFileSync, writeFileSync } from "fs";
import express from "express";
const app = express();
app.use(express.json());
app.get("/add-request", (req, res) => {
  processResources(projectPath).then((resources) => {
    console.log("All Resources:", JSON.stringify(resources, null, 2));
    buildRestCall(
      "GET",
      resources[0].name,
      { description: "one" },
      resources[0].files[1],
    );
  });
  res.status(200).json({ message: "received" });
});
app.post("/create-new-resource/:id", (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  createNewResource(projectPath, id, req.body.data);
  res.status(200).json({ message: "received" });
});
app.post("/has-many", (req, res) => {
  console.log("ss");
  console.log(req.body);
  hasMany(projectPath, req.body.data);
  res.status(200).json({ message: "received" });
});
const PORT = process.env.PORT || 1234;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
async function getAllFiles(dirPath, arrayOfFiles = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}
async function processResources(projectPath) {
  try {
    const files = await getAllFiles(projectPath);
    const cleanedFiles = files.map((file) => file.replace(projectPath, ""));
    const uniqueFolders = [
      ...new Set(
        cleanedFiles
          .filter((file) => file.startsWith("/src/main/java/com/natetrystuff/"))
          .map((file) => {
            const match = file.match(
              /^\/src\/main\/java\/com\/natetrystuff\/([^\/]+)(\/|$)/,
            );
            return match ? match[1] : null;
          }),
      ),
    ]
      .filter(Boolean)
      .filter((value) => {
        const isFile = value.includes(".");
        if (isFile) {
          return false;
        }
        return true;
      });
    const resources = await Promise.all(
      uniqueFolders.map(async (folder) => {
        var _a;
        const resourceFiles = cleanedFiles.filter((file) =>
          file.startsWith(`/src/main/java/com/natetrystuff/${folder}/`),
        );
        const controllerFile = resourceFiles.find((file) =>
          file.endsWith("Controller.java"),
        );
        let restMethods = [];
        if (controllerFile) {
          const data = await fs.readFile(projectPath + controllerFile, "utf8");
          restMethods =
            (_a =
              data === null || data === void 0
                ? void 0
                : data.match(/@[A-Za-z]+Mapping(\("[^"]*"\))?/g)) === null ||
            _a === void 0
              ? void 0
              : _a
                  .filter((restCall) => {
                    if (restCall.includes("RequestMapping")) {
                      console.log("removing", restCall);
                      return false;
                    }
                    return true;
                  })
                  .filter(Boolean);
        }
        return {
          name: folder,
          files: resourceFiles,
          restMethods: restMethods,
        };
      }),
    );
    return resources;
    console.log("All Resources:", JSON.stringify(resources, null, 2));
  } catch (error) {
    console.error("Error processing resources:", error);
  }
}
async function createObjectFile(resourcePath, resourceName, body) {
  const content = `
package com.natetrystuff.${resourceName};

import lombok.Data;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
@Entity
@Data
public class ${resourceName} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ${resourceName}Id;

    private String ${body.propertieName};
}
`;
  // The filename for the Java class
  const fileName = `${resourceName}.java`;
  // Full path where the file will be written
  const fullPath = path.join(resourcePath, fileName);
  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`File created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating Java file:", error);
  }
}
async function createServiceFile(resourcePath, resourceName) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ${resourceName}Service {

    private final ${resourceName}Repository ${resourceName.toLowerCase()}Repository;

    public ${resourceName}Service(${resourceName}Repository ${resourceName.toLowerCase()}Repository) {
        this.${resourceName.toLowerCase()}Repository = ${resourceName.toLowerCase()}Repository;
    }

    public List<${resourceName}> listAll${resourceName}s() {
        return ${resourceName.toLowerCase()}Repository.findAll();
    }

    public ${resourceName} get${resourceName}ById(Long id) {
        return ${resourceName.toLowerCase()}Repository.findById(id).orElse(null);
    }

    public ${resourceName} create${resourceName}(${resourceName} ${resourceName.toLowerCase()}) {
        return ${resourceName.toLowerCase()}Repository.save(${resourceName.toLowerCase()});
    }

    public ${resourceName} update${resourceName}(Long id, ${resourceName} ${resourceName.toLowerCase()}Details) {
        ${resourceName} existing${resourceName} = ${resourceName.toLowerCase()}Repository.findById(id).orElse(null);
        if (existing${resourceName} != null) {
            existing${resourceName}.set${resourceName}Name(${resourceName.toLowerCase()}Details.get${resourceName}Name());
            return ${resourceName.toLowerCase()}Repository.save(existing${resourceName});
        }
        throw new RuntimeException("${resourceName} not found with id " + id);
    }

    public void delete${resourceName}(Long id) {
        ${resourceName.toLowerCase()}Repository.deleteById(id);
    }
}
`;
  const fileName = `${resourceName}Service.java`;
  const fullPath = path.join(resourcePath, fileName);
  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Service file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating service file:", error);
  }
}
async function createControllerFile(resourcePath, resourceName) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/${resourceName.toLowerCase()}s")
public class ${resourceName}Controller {

    private final ${resourceName}Service ${resourceName.toLowerCase()}Service;

    public ${resourceName}Controller(${resourceName}Service ${resourceName.toLowerCase()}Service) {
        this.${resourceName.toLowerCase()}Service = ${resourceName.toLowerCase()}Service;
    }

    @GetMapping
    public List<${resourceName}> getAll${resourceName}s() {
        return ${resourceName.toLowerCase()}Service.listAll${resourceName}s();
    }

    @PostMapping
    public ResponseEntity<${resourceName}> add${resourceName}(@RequestBody ${resourceName} ${resourceName.toLowerCase()}) {
        ${resourceName} new${resourceName} = ${resourceName.toLowerCase()}Service.create${resourceName}(${resourceName.toLowerCase()});
        return new ResponseEntity<>(new${resourceName}, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<${resourceName}> get${resourceName}ById(@PathVariable Long id) {
        ${resourceName} ${resourceName.toLowerCase()} = ${resourceName.toLowerCase()}Service.get${resourceName}ById(id);
        if (${resourceName.toLowerCase()} != null) {
            return new ResponseEntity<>(${resourceName.toLowerCase()}, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<${resourceName}> update${resourceName}(@PathVariable Long id, @RequestBody ${resourceName} ${resourceName.toLowerCase()}Details) {
        try {
            ${resourceName} updated${resourceName} = ${resourceName.toLowerCase()}Service.update${resourceName}(id, ${resourceName.toLowerCase()}Details);
            return new ResponseEntity<>(updated${resourceName}, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete${resourceName}(@PathVariable Long id) {
        ${resourceName.toLowerCase()}Service.delete${resourceName}(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
`;
  const fileName = `${resourceName}Controller.java`;
  const fullPath = path.join(resourcePath, fileName);
  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Controller file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating controller file:", error);
  }
}
async function hasMany(projectPath, body) {
  console.log(body);
  const class1 = body.class1;
  const class2 = body.class2;
  const class1Path = path.join(
    projectPath,
    "/src/main/java/com/natetrystuff/",
    class1,
  );
  const class2Path = path.join(
    projectPath,
    "/src/main/java/com/natetrystuff/",
    class2,
  );
  const class1ObjectFile = readFileSync(
    class1Path + "/" + class1 + ".java",
    "utf8",
  );
  console.log(class1ObjectFile);
  //first find where to add to object class
}
async function createRepositoryFile(resourcePath, resourceName) {
  const content = `
package com.natetrystuff.${resourceName};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${resourceName}Repository extends JpaRepository<${resourceName}, Long> {
}
`;
  const fileName = `${resourceName}Repository.java`;
  const fullPath = path.join(resourcePath, fileName);
  try {
    await writeFileSync(fullPath, content, "utf8");
    console.log(`Repository file created successfully at: ${fullPath}`);
  } catch (error) {
    console.error("Error creating repository file:", error);
  }
}
async function createNewResource(projectPath, resourceName, body) {
  try {
    console.log("here");
    const resourcePath = path.join(
      projectPath,
      "/src/main/java/com/natetrystuff/",
      resourceName,
    );
    try {
      await fs.access(resourcePath); // Try to access the directory to check if it exists
      console.log("Resource folder already exists at:", resourcePath);
    } catch (_a) {
      // If the directory does not exist, access will throw an error which we catch here to then create the directory
      await fs.mkdir(resourcePath, { recursive: true });
      console.log("New resource folder created at:", resourcePath);
      createObjectFile(resourcePath, resourceName, body);
      createRepositoryFile(resourcePath, resourceName);
      createServiceFile(resourcePath, resourceName);
      createControllerFile(resourcePath, resourceName);
    }
  } catch (error) {
    console.error("Error creating new resource folder:", error);
  }
}
function buildRestCall(method, resource, options, controllerFile) {
  if (method === "GET" && options.description === "all") {
    //   addGetAllRequest(controllerFile, resource);
  }
  if (method === "GET" && options.description === "one") {
    addGetOneRequest(controllerFile, resource);
  }
  if (method === "POST" && options.description === "one") {
    //   addPostOneRequest(controllerFile, resource);
  }
  if (method === "DELETE" && options.description === "one") {
    //   addDeleteOneRequest(controllerFile, resource);
  }
}
function addGetOneRequest(controllerFile, resource) {
  const MOCK_CODE = `
    @GetMapping("/{id}")
    public ResponseEntity<${resource}> get${resource}ById(@PathVariable Long id) {
    return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
`;
  console.log(resource);
  const CODE_READY = MOCK_CODE.replace("resource", resource);
  console.log("CODE_READY:", CODE_READY);
  console.log("Controller File:", controllerFile);
  const lineToAdd = findLineToAddGetOneRequest(controllerFile);
  console.log("Line to add:", lineToAdd);
  addToFile(controllerFile, lineToAdd, CODE_READY);
}
function findLineToAddGetOneRequest(filePath) {
  const fileContent = readFileSync(projectPath + filePath, "utf8");
  const lines = fileContent.split("\n");
  const pattern = "@PostMapping";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i;
    }
  }
  return -1;
}
function addToFile(filePath, line, text) {
  const fileContent = readFileSync(projectPath + filePath, "utf8");
  const lines = fileContent.split("\n");
  // Adjust for 0-indexed array; insert the new content just before the specified line
  lines.splice(line - 1, 0, text);
  // Join the array back into a single string with new lines and write it back to the file
  const updatedContent = lines.join("\n");
  writeFileSync(projectPath + filePath, updatedContent, "utf8");
}
const projectPath =
  "/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff";
