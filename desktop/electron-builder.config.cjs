// electron-builder loads this on the native build host, before packaging.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { build } = require("./package.json");
const config = structuredClone(build);
const arch = process.env.GITCLAW_TARGET_ARCH || process.arch;
if (arch !== process.arch) {
  throw new Error(`Build ${arch} on a native ${arch} runner so the server, database and Electron binaries match.`);
}
const required = process.env.GITCLAW_REQUIRE_SIGNING === "1";
const signed = Boolean(process.env.CSC_LINK || process.env.CSC_NAME);
const notarize = Boolean(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID);
for (const platform of ["win", "mac", "linux"]) {
  config[platform].target = config[platform].target.map(({ target }) => ({ target, arch: [arch] }));
}
if (process.platform === "darwin") {
  if (required && (!signed || !notarize)) throw new Error("Public macOS releases require Developer ID signing and Apple notarization credentials.");
  if (signed) delete config.mac.identity;
  config.mac.hardenedRuntime = signed;
  config.mac.notarize = notarize;
  if (signed) {
    config.mac.entitlements = "entitlements.mac.plist";
    config.mac.entitlementsInherit = "entitlements.mac.plist";
  }
  config.forceCodeSigning = required;
}
if (process.platform === "win32") {
  if (required && !signed) throw new Error("Public Windows releases require a code signing certificate in CSC_LINK.");
  config.win.signAndEditExecutable = signed;
  config.forceCodeSigning = required;
}
module.exports = config;
