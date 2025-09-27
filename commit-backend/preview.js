import { exec } from "child_process";
import { promisify } from "util";
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const execAsync = promisify(exec);
const tmpDir = path.resolve("./tmp");

function detectProjectType(workdir) {
  // First check root directory
  let pkgPath = path.join(workdir, "package.json");
  let projectDir = workdir;
  
  if (!existsSync(pkgPath)) {
    // If no package.json in root, look for it in subdirectories
    const subdirs = readdirSync(workdir).filter(item => 
      statSync(path.join(workdir, item)).isDirectory()
    );
    
    for (const subdir of subdirs) {
      const subPkgPath = path.join(workdir, subdir, "package.json");
      if (existsSync(subPkgPath)) {
        pkgPath = subPkgPath;
        projectDir = path.join(workdir, subdir);
        console.log(`Found package.json in subdirectory: ${subdir}`);
        break;
      }
    }
    
    if (!existsSync(pkgPath)) {
      return { type: "node", projectDir: workdir }; // fallback
    }
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const scripts = pkg.scripts || {};
  console.log("Detected scripts:", scripts);

  let projectType = "node"; // fallback
  if (scripts["build"] && scripts["build"].includes("next build")) {
    console.log("Detected Next.js project");
    projectType = "nextjs";
  } else if (scripts["react-scripts build"]) {
    projectType = "react"; // CRA
  } else if (scripts["build"] && scripts["build"].includes("vite build")) {
    projectType = "vite";
  } else if (scripts["nest build"]) {
    projectType = "nestjs";
  }
  
  return { type: projectType, projectDir };
}

function generateDockerfile(workdir, type, projectDir) {
  const relativeProjectPath = path.relative(workdir, projectDir);
  const copyPath = relativeProjectPath === "." ? "." : `./${relativeProjectPath}`;
  
  let dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY ${copyPath}/package*.json ./
RUN npm install --legacy-peer-deps
COPY ${copyPath} ./
`;

  switch (type) {
    case "nextjs":
      dockerfile += `
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
`;
      break;

    case "react":
      dockerfile += `
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
`;
      break;

    case "vite":
      dockerfile += `
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--port", "3000", "--host"]
`;
      break;

    case "nestjs":
      dockerfile += `
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
`;
      break;

    default:
      dockerfile += `
EXPOSE 3000
CMD ["npm", "start"]
`;
      break;
  }

  writeFileSync(path.join(workdir, "Dockerfile"), dockerfile.trimStart());
}

export async function spawnBuildAndRun({ owner, repo, commit, id }, onUpdate) {
  const workdir = path.join(tmpDir, id);

  if (existsSync(workdir)) {
    rmSync(workdir, { recursive: true, force: true });
  }
  mkdirSync(workdir, { recursive: true });

  try {
    onUpdate({ status: "cloning" });

    try {
      await execAsync(
        `git clone --depth 1 --branch ${commit} https://github.com/${owner}/${repo}.git ${workdir}`
      );
    } catch (e) {
      await execAsync(
        `git clone https://github.com/${owner}/${repo}.git ${workdir}`
      );
      await execAsync(`cd ${workdir} && git checkout ${commit}`);
    }

    const dockerfilePath = path.join(workdir, "Dockerfile");
    const { type: projectType, projectDir } = detectProjectType(workdir);

    if (!existsSync(dockerfilePath)) {
      console.log(`No Dockerfile found, generating one for ${projectType}...`);
      generateDockerfile(workdir, projectType, projectDir);
    } else {
      console.log("Dockerfile already exists in repo.");
    }

    onUpdate({ status: "building" });
    await execAsync(`docker build -t preview:${id} ${workdir}`);

    onUpdate({ status: "running" });
    const { stdout } = await execAsync(
      `docker run -d -P --name preview-${id} preview:${id}`
    );

    const { stdout: portOut } = await execAsync(
      `docker port preview-${id} 3000/tcp`
    );
    const port = portOut.split(":").pop().trim();

    const url = `http://localhost:${port}`;
    onUpdate({ status: "ready", url });
  } catch (err) {
    console.error("Build failed:", err);
    onUpdate({ status: "error", error: err.message });
  }
}

export async function stopPreview(id) {
  await execAsync(`docker rm -f preview-${id} || true`);
}
