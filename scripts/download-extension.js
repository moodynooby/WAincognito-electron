const AdmZip = require("adm-zip");
const path = require("node:path");
const fs = require("node:fs");
const https = require("node:https");
const { app } = require("electron");

const EXTENSION_VERSION = "2.4.1";
const EXTENSION_REPO = "tomer8007/whatsapp-web-incognito";

function getExtensionPath() {
	const isPackaged = process.env.NODE_ENV === "production" || app?.isPackaged;

	if (isPackaged) {
		return path.join(process.resourcesPath, "app.asar.unpacked/src/extensions/wa-incognito");
	} else {
		return path.join(__dirname, "..", "src", "extensions", "wa-incognito");
	}
}

function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https.get(url, (response) => {
			if (response.statusCode === 301 || response.statusCode === 302) {
				downloadFile(response.headers.location, dest).then(resolve).catch(reject);
				return;
			}
			if (response.statusCode !== 200) {
				reject(new Error(`HTTP ${response.statusCode}`));
				return;
			}
			response.pipe(file);
			file.on("finish", () => {
				file.close();
				resolve();
			});
		}).on("error", (err) => {
			fs.unlink(dest, () => {});
			reject(err);
		});
	});
}

async function downloadExtension() {
	const extPath = getExtensionPath();
	const tempZip = path.join(app?.getPath?.("temp") || "/tmp", `wa-incognito-${EXTENSION_VERSION}.zip`);

	console.log(`Downloading WA Incognito extension v${EXTENSION_VERSION}...`);
	console.log(`Destination: ${extPath}`);

	const downloadUrl = `https://github.com/${EXTENSION_REPO}/archive/refs/tags/v${EXTENSION_VERSION}.zip`;

	try {
		await downloadFile(downloadUrl, tempZip);
		console.log("Download complete. Extracting...");

		if (fs.existsSync(extPath)) {
			fs.rmSync(extPath, { recursive: true, force: true });
		}

		const zip = new AdmZip(tempZip);
		zip.extractAllTo(path.dirname(extPath), true);

		const extractedFolder = path.join(path.dirname(extPath), `whatsapp-web-incognito-${EXTENSION_VERSION}`);
		if (fs.existsSync(extractedFolder)) {
			fs.renameSync(extractedFolder, extPath);
		}

		fs.unlinkSync(tempZip);

		console.log("Extension extracted successfully!");
		process.exit(0);
	} catch (e) {
		console.error("Failed to download extension:", e.message);
		if (fs.existsSync(tempZip)) {
			fs.unlinkSync(tempZip);
		}
		process.exit(1);
	}
}

if (require.main === module) {
	downloadExtension();
}

module.exports = { downloadExtension, getExtensionPath, EXTENSION_VERSION };
