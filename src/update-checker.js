const { app, Notification } = require("electron");
const Store = require("electron-store");
const Constants = require("./constants");

class UpdateChecker {
	constructor(extensionManager) {
		this.store = new Store();
		this.extensionManager = extensionManager;
		this.extensionRepo = "tomer8007/whatsapp-web-incognito";
		this.appRepo = "dagmoller/whatsapp-electron";
		this.lastCheckKey = "lastUpdateCheck";
		this.checkIntervalHours = 24;
	}

	async fetchLatestRelease(repo) {
		try {
			const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
				headers: {
					Accept: "application/vnd.github+json",
					"User-Agent": "WhatsApp-Electron",
				},
			});

			if (!response.ok) {
				console.error(`GitHub API error: ${response.status} ${response.statusText}`);
				return null;
			}

			const data = await response.json();
			return {
				tag_name: data.tag_name?.replace(/^v/, "") || "0.0.0",
				html_url: data.html_url,
				body: data.body,
			};
		} catch (e) {
			console.error("Failed to fetch release:", e.message);
			return null;
		}
	}

	compareVersions(current, latest) {
		const currentParts = current.split(".").map(Number);
		const latestParts = latest.split(".").map(Number);

		for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
			const c = currentParts[i] || 0;
			const l = latestParts[i] || 0;
			if (l > c) return -1;
			if (c > l) return 1;
		}
		return 0;
	}

	shouldCheck() {
		const lastCheck = this.store.get(this.lastCheckKey);
		if (!lastCheck) return true;

		const hoursSinceLastCheck = (Date.now() - lastCheck) / (1000 * 60 * 60);
		return hoursSinceLastCheck >= this.checkIntervalHours;
	}

	updateLastCheck() {
		this.store.set(this.lastCheckKey, Date.now());
	}

	async checkForUpdates(silent = false) {
		const results = {
			extension: { current: null, latest: null, updateAvailable: false },
			app: { current: null, latest: null, updateAvailable: false },
			checkedAt: Date.now(),
		};

		const extVersion = this.extensionManager?.getCurrentVersion();
		if (extVersion) {
			results.extension.current = extVersion;
		} else if (Constants.extension?.version) {
			results.extension.current = Constants.extension.version;
		}

		const appVersion = Constants.version || app.getVersion();
		results.app.current = appVersion;

		const [extRelease, appRelease] = await Promise.all([
			this.fetchLatestRelease(this.extensionRepo),
			this.fetchLatestRelease(this.appRepo),
		]);

		if (extRelease) {
			results.extension.latest = extRelease.tag_name;
			results.extension.html_url = extRelease.html_url;
			results.extension.updateAvailable = this.compareVersions(results.extension.current, extRelease.tag_name) < 0;
		}

		if (appRelease) {
			results.app.latest = appRelease.tag_name;
			results.app.html_url = appRelease.html_url;
			results.app.updateAvailable = this.compareVersions(results.app.current, appRelease.tag_name) < 0;
		}

		this.updateLastCheck();

		if (!silent) {
			if (results.app.updateAvailable) {
				this.showUpdateNotification("App", results.app.current, results.app.latest, results.app.html_url);
			}
			if (results.extension.updateAvailable) {
				this.showUpdateNotification(
					"Extension",
					results.extension.current,
					results.extension.latest,
					results.extension.html_url
				);
			}
		}

		return results;
	}

	showUpdateNotification(type, currentVersion, latestVersion, url) {
		if (!Notification.isSupported()) {
			console.log(`Update available: ${type} ${currentVersion} -> ${latestVersion}`);
			return;
		}

		const notification = new Notification({
			title: `${type} Update Available`,
			body: `${type} has been updated to version ${latestVersion} (current: ${currentVersion})`,
		});

		notification.on("click", () => {
			require("electron").shell.openExternal(url);
		});

		notification.show();
	}
}

module.exports = { UpdateChecker };
