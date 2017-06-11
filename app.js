const acorn = require('acorn'),
      fs = require('fs'),
      readline = require('readline'),
      beautify = require('js-beautify').js_beautify;

const readFile = (path) => fs.readFileSync(path, 'utf8');

function requireComplianceLocation(fileData) {
    let [requireIdentifierPresent,
	 requireListPresent,
	 requireNamespacePresent,
 	 requireScopePresent] = [false, false, false, false];

    for (let token of acorn.tokenizer(fileData)) {
	if (!requireIdentifierPresent
	    && !requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {
	    if (token.value === 'require') {
		requireIdentifierPresent = true;
		continue;
	    }
	}

	if (requireIdentifierPresent
	    && !requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === '[') {
		requireListPresent = true;
	    }
	}

	if (requireIdentifierPresent
	    && requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === 'function') {
		requireNamespacePresent = true;
	    }
	}

	if (requireIdentifierPresent
	    && requireListPresent
	    && requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === '{') {
		return token.start;
	    }
	}
    }

    return null;
}

function collectRequireModules(fileData) {
    let [requireIdentifierPresent,
	 requireListPresent,
	 requireNamespacePresent,
 	 requireScopePresent] = [false, false, false, false];

    let modulePathList = [];
    let moduleNamespaceList = [];
    let moduleTuples = [];

    for (let token of acorn.tokenizer(fileData)) {
	if (!requireIdentifierPresent
	    && !requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {
	    if (token.value === 'require') {
		requireIdentifierPresent = true;
	    }
	}

	if (requireIdentifierPresent
	    && !requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === '[') {
		requireListPresent = true;
	    }
	}

	if (requireIdentifierPresent
	    && requireListPresent
	    && !requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === 'string') {
		modulePathList.push(token.value);
	    } else if (token.type.label === 'function') {
		requireNamespacePresent = true;
	    }
	}

	if (requireIdentifierPresent
	    && requireListPresent
	    && requireNamespacePresent
	    && !requireScopePresent) {

	    if (token.type.label === 'name') {
		moduleNamespaceList.push(token.value);
	    } else if (token.type.label === '{') {
		break;
	    }
	}
    }

    let iterationLimit = Math.min(modulePathList.length, moduleNamespaceList.length);

    for (let i = 0; i < iterationLimit; i++) {
	moduleTuples.push({
	    path: modulePathList[i],
	    namespace: moduleNamespaceList[i]
	});
    }

    return moduleTuples;

}

function commonComplianceLocation(fileData) {
    let [commonDeclarePresent,
	 commonVariablePresent,
	 commonRequirePresent] = [false, false, false];

    for (let token of acorn.tokenizer(fileData)) {
	if (!commonDeclarePresent
	    && !commonVariablePresent
	    && !commonRequirePresent) {
	    if (token.type.label === "const"
	        || token.type.label === "let"
	        || token.type.label === "var") {

		commonDeclarePresent = true;
	    }
	}

	if (commonDeclarePresent
	    && !commonVariablePresent
	    && !commonRequirePresent) {
	    if (token.type.label === "name")  {
		commonVariablePresent = true;
	    }
	}

	if (commonDeclarePresent
	    && commonVariablePresent
	    && !commonRequirePresent) {
	    if (token.value === "require") {
		return token.start;
	    }
	}
    }

    return null;
}

function collectCommonModules(fileData) {
    let [commonVariablePresent,
	 commonRequirePresent] = [false, false, false];

    let modulePathList = [];
    let moduleNamespaceList = [];
    let moduleTuples = [];

    for (let token of acorn.tokenizer(fileData)) {
	if (!commonVariablePresent
	    && !commonRequirePresent) {
	    if (token.type.label === "name")  {
		moduleNamespaceList.push(token.value);
		commonVariablePresent = true;
	    }
	}

	if (commonVariablePresent
	    && !commonRequirePresent) {
	    if (token.value === "require") {
		commonRequirePresent = true;
	    }
	}

	if (commonVariablePresent
	    && commonRequirePresent) {
	    if (token.type.label === "string") {
		modulePathList.push(token.value);

		commonVariablePresent = false;
		commonRequirePresent = false;

		if (token.value === "require") {
		    modulePathList.pop();
		    moduleNamespaceList.pop();
		}
	    }
	}
    }

    let iterationLimit = Math.min(modulePathList.length, moduleNamespaceList.length);

    for (let i = 0; i < iterationLimit; i++) {
	moduleTuples.push({
	    path: modulePathList[i],
	    namespace: moduleNamespaceList[i]
	});
    }

    return moduleTuples;
}

function es6ComplianceLocation(fileData) {
    let [es6ImportPresent,
	 es6FromPresent,
	 es6ModulePresent] = [false, false, false];
    
    for (let token of acorn.tokenizer(fileData)) {
	if (!es6ImportPresent
	    && !es6FromPresent
	    && !es6ModulePresent) {

	    if (token.value === "import") {
		es6ImportPresent = true;
	    }
	}

	if (es6ImportPresent
	    && !es6FromPresent
	    && !es6ModulePresent) {

	    if (token.value === "from") {
		es6FromPresent = true;
	    }
	}

	if (es6ImportPresent
	    && es6FromPresent
	    && !es6ModulePresent) {

	    if (token.type.label === "string") {
		return token.start;
	    }
	}
    }

    return null;
}

function collectES6Modules(fileData) {
    let [es6ImportPresent,
	 es6FromPresent,
	 es6ModulePresent] = [false, false, false];
    
    let modulePathList = [];
    let moduleNamespaceList = [];
    let moduleTuples = [];

    for (let token of acorn.tokenizer(fileData)) {
	if (!es6ImportPresent
	    && !es6FromPresent
	    && !es6ModulePresent) {

	    if (token.value === "import") {
		es6ImportPresent = true;
	    }
	}

	if (es6ImportPresent
	    && !es6FromPresent
	    && !es6ModulePresent) {

	    if (token.type.label === "name" && token.value !== "from") {
		moduleNamespaceList.push(token.value);
	    } else if (token.value === "from") {
		es6FromPresent = true;
	    }
	}

	if (es6ImportPresent
	    && es6FromPresent
	    && !es6ModulePresent) {

	    if (token.type.label === "string") {
		modulePathList.push(token.value);

		[es6ImportPresent,
		 es6FromPresent,
		 es6ModulePresent] = [false, false, false];
	    }
	}
    }

    let iterationLimit = Math.min(modulePathList.length, moduleNamespaceList.length);

    for (let i = 0; i < iterationLimit; i++) {
	moduleTuples.push({
	    path: modulePathList[i],
	    namespace: moduleNamespaceList[i]
	});
    }

    return moduleTuples;
    return null;
}

function determineModuleSchema(fileData) {
    const requireLocation = requireComplianceLocation(fileData),
	  commonLocation = commonComplianceLocation(fileData),
	  es6Location = es6ComplianceLocation(fileData);

    if (!requireLocation && !commonLocation && !es6Location ) {
	throw Error("determineModuleSchema found that this file complies with no module schemas.");
    }

    function lhsTakesPriority(lhs, rhs) {
	if (rhs === null) {
	    return true;
	} else if (lhs === null) {
	    return false;
	} else {
	    return lhs < rhs
	}

    }

    if (lhsTakesPriority(requireLocation, commonLocation)
	&& lhsTakesPriority(requireLocation, es6Location)) {
	return "RequireJS";
    } else if (lhsTakesPriority(commonLocation, requireLocation)
	       && lhsTakesPriority(commonLocation, es6Location)) {
	return "CommonJS";
    } else if (lhsTakesPriority(es6Location, requireLocation)
	       && lhsTakesPriority(es6Location, commonLocation)) {
	return "ES6";
    } else {
	throw Error("An edge case occurred regarding how your file manages its modules, it thinks that you are using two systems!");
    }
}

function makeRequireGeneric(fileData) {
    let re = /require\ *\(\ *\[[\S+\n\r\s]+\], function\(.*\) [\S+\n\r\s]*\{([\S+\n\r\s]*)\}\)/g;

    return beautify(re.exec(fileData)[1], {index_size: 2});
}

function makeCommonGeneric(fileData) {
    let re = /[\S+\n\r\s]*\ *.* = require\(.*\).*[,|;]/g; 
    return beautify(fileData.replace(re, ''));
}

function makeES6Generic(fileData) {
    let re = /import\ *.*\ *from\ *.*/g;
    return beautify(fileData.replace(re, ''));
}

function injectCommonHeader(fileData, modules) {
    let header = "";

    for (const module of modules) {
	header += `var ${module['namespace']} = require("${module['path']}");\n`;
    }

    header += '\n';

    return beautify(header + fileData);
}

function injectES6Header(fileData, modules) {
    let header = "";

    for (const module of modules) {
	header += `import ${module['namespace']} from "${module['path']}";\n`;
    }

    header += '\n';

    return beautify(header + fileData);
}

function injectRequireHeader(fileData, modules) {
    let header = "";

    header += "require([\n";

    for (const module of modules) {
	header += '"' + module['path'] + '",\n';
    }

    header = header.slice(0, -2);
    header += '], function(';

    for (const module of modules) {
	header += module['namespace'] + ', ';
    }

    header = header.slice(0, -2);
    header += ') {\n';
    header += fileData;
    header += '});';


    return beautify(header);
}

function convertFileTo(fileData, moduleType) {
    const fileType = determineModuleSchema(fileData);
    let genericFile = null;
    let modules = null;

    if (fileType === 'ES6') {
	modules = collectES6Modules(fileData);
	genericFile = makeES6Generic(fileData);
    } else if (fileType === 'RequireJS') {
	modules = collectRequireModules(fileData);
	genericFile = makeRequireGeneric(fileData);
    } else if (fileType === 'CommonJS') {
	modules = collectCommonModules(fileData);
	genericFile = makeCommonGeneric(fileData);
    } 

    if (moduleType === 'ES6') {
	return injectES6Header(genericFile, modules);
    } else if (moduleType === 'RequireJS') {
	return injectRequireHeader(genericFile, modules);
    } else if (moduleType === 'CommonJS') {
	return injectCommonHeader(genericFile, modules);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Filename? ', (file) => {
    const fileData = readFile(file);

    rl.question('Type? ', (moduleType) => {
	const newFile = convertFileTo(fileData, moduleType);
	fs.writeFile(file, newFile);

	rl.close();
    });
});

