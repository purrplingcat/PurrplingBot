var fs = require('fs'),
    path = require('path');
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

console.log("***********");

var plugin_folders;
var plugin_directory;
var exec_dir;
try { //try loading plugins from a non standalone install first
    plugin_directory = "./plugins/";
    plugin_folders = getDirectories(plugin_directory);
} catch(e){//load paths for an Electrify install
    exec_dir = path.dirname(process.execPath) + "/resources/default_app/"; //need this to change node prefix for npm installs
    plugin_directory = path.dirname(process.execPath) + "/resources/default_app/plugins/";
    plugin_folders = getDirectories(plugin_directory);
}

function createNpmDependenciesArray (packageFilePath) {
    var p = require(packageFilePath);
    if (!p.dependencies) return [];
    var deps = [];
    for (var mod in p.dependencies) {
        deps.push(mod + "@" + p.dependencies[mod]);
    }

    return deps;
}

function npm_install(){
    var deps = [];
    var npm = require("npm");
    for (var i = 0; i < plugin_folders.length; i++) {
        try{
            require(plugin_directory + plugin_folders[i]);
        } catch(e) {
            deps = deps.concat(createNpmDependenciesArray(plugin_directory + plugin_folders[i] + "/package.json"));
        }
    }
    if(deps.length > 0) {
        npm.load({
            loaded: false
        }, function (err) {
            // catch errors
            if (plugin_directory != "./plugins/"){ //install plugin modules for Electrify builds
                npm.prefix = exec_dir;
                console.log(npm.prefix);
            }
            npm.commands.install(deps, function (er, data) {
                if(er){
                    console.log(er);
                }
                console.log("Plugin NPM install complete!");
            });

            if (err) {
                console.log("preload_plugins: " + err);
            }
        });
    } else {
        console.log("No dependencies to install");
    }
}

npm_install();
