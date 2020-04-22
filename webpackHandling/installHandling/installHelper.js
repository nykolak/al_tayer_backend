var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');

/**
 * Runs 'npm install' for cartridge
 * @param {string} folder folderpath to install
 */
function npmInstall(folder) {
    var cartridgeFolder = folder.split('cartridges')[0];
    var hasPackageJson = fs.existsSync(path.resolve(cartridgeFolder, 'package.json'));

    // Abort if there's no 'package.json' in this folder
    if (!hasPackageJson) {
        return;
    }

    childProcess.execSync('npm install', { cwd: cartridgeFolder, env: process.env, stdio: 'inherit', windowsHide: true });
}

module.exports = {
    npmInstall: npmInstall
};
