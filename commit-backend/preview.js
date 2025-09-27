import { exec } from "child_process";
import { promisify } from "util";
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "fs";
import path from "path";

const execAsync = promisify(exec);
const tmpDir = path.resolve("./tmp");

function detectProjectType(workdir) {
  const pkgPath = path.join(workdir, "package.json");
  if (!existsSync(pkgPath)) return "node"; // fallback

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const scripts = pkg.scripts || {};
  console.log("Detected scripts:", scripts);

  if (scripts["build"].includes("next build")) {
    console.log("Detected Next.js project");
    return "nextjs";
  }
  if (scripts["react-scripts build"]) return "react"; // CRA
  if (scripts["vue-cli-service build"]) return "vue";
  if (scripts["nest build"]) return "nestjs";
  return "node"; // fallback
}

function generateDockerfile(workdir, type) {
  let dockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
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

    case "vue":
      dockerfile += `
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
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
    const projectType = detectProjectType(workdir);

    if (!existsSync(dockerfilePath)) {
      console.log(`No Dockerfile found, generating one for ${projectType}...`);
      generateDockerfile(workdir, projectType);
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
