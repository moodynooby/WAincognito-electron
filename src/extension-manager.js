const AdmZip = require("adm-zip");
const { app, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

class ExtensionManager {
	constructor() {
		this.extensionPath = null;
		this.currentVersion = null;
	}

	getExtensionPath() {
		if (this.extensionPath != null) return this.extensionPath;

		const isPackaged = app.isPackaged;

		if (isPackaged) {
			this.extensionPath = path.join(process.resourcesPath, "app.asar.unpacked/src/extensions/wa-incognito");
		} else {
			this.extensionPath = path.join(__dirname, "extensions/wa-incognito");
		}

		return this.extensionPath;
	}

	getCurrentVersion() {
		if (this.currentVersion != null) return this.currentVersion;

		const manifestPath = path.join(this.getExtensionPath(), "manifest.json");

		if (fs.existsSync(manifestPath)) {
			try {
				const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
				this.currentVersion = manifest.version;
			} catch (e) {
				console.error("Failed to read extension version:", e);
				this.currentVersion = null;
			}
		}

		return this.currentVersion;
	}

	async loadExtensionForSession(partitionId) {
		const extPath = this.getExtensionPath();

		if (!fs.existsSync(extPath)) {
			console.log("Extension not found at:", extPath);
			return { success: false, error: "Extension not found" };
		}

		const manifestPath = path.join(extPath, "manifest.json");
		if (!fs.existsSync(manifestPath)) {
			console.log("Extension manifest not found at:", manifestPath);
			return { success: false, error: "Extension manifest not found" };
		}

		try {
			const ses = typeof partitionId === "string" ? session.fromPartition(partitionId) : partitionId;
			await ses.loadExtension(extPath);
			console.log("Extension loaded successfully for session");
			return { success: true };
		} catch (e) {
			console.error("Failed to load extension:", e.message);
			return { success: false, error: e.message };
		}
	}

	async downloadExtension(version) {
		const downloadUrl = `https://github.com/tomer8007/whatsapp-web-incognito/archive/refs/tags/v${version}.zip`;
		const tempPath = path.join(app.getPath("temp"), `wa-incognito-${version}.zip`);
		const extractPath = this.getExtensionPath();

		console.log("Downloading extension from:", downloadUrl);

		try {
			const response = await fetch(downloadUrl);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const buffer = await response.arrayBuffer();
			fs.writeFileSync(tempPath, Buffer.from(buffer));

			console.log("Extracting extension to:", extractPath);

			if (fs.existsSync(extractPath)) {
				fs.rmSync(extractPath, { recursive: true, force: true });
			}

			const zip = new AdmZip(tempPath);
			zip.extractAllTo(path.dirname(extractPath), true);

			const extractedFolder = path.join(path.dirname(extractPath), `whatsapp-web-incognito-${version}`);
			if (fs.existsSync(extractedFolder)) {
				fs.renameSync(extractedFolder, extractPath);
			}

			fs.unlinkSync(tempPath);

			this.currentVersion = version;
			console.log("Extension downloaded and extracted successfully");

			return { success: true, version: version };
		} catch (e) {
			console.error("Failed to download extension:", e.message);
			if (fs.existsSync(tempPath)) {
				fs.unlinkSync(tempPath);
			}
			return { success: false, error: e.message };
		}
	}
}

module.exports = { ExtensionManager };
