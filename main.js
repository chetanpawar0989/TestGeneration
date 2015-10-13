var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

var areaCode = "";

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {
			file1: ''
		},
		'path/fileExistsWithNoContents': {
		}
	},
	fileWithContent:
	{
		pathwithcontent: 
		{	
  			file1: 'text content',
  			file2: ''
		}
	}
};

var fileParamName = '';

function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			params[paramName] = [];
			if (paramName == "phoneNumber") 
			{
				var fakeNumber = faker.phone.phoneNumber();
				params[paramName].push('\'' + fakeNumber + '\'');
				params[paramName].push('\'\'');
				if (areaCode) {
					fakeNumber = faker.phone.phoneNumber(areaCode + ".###.####");
					params[paramName].push('\'' + fakeNumber + '\'');
				}
			}
			//params[paramName].push('\'\'');
		}

		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });

		// plug-in values for parameters
		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];			
			if( params.hasOwnProperty( constraint.ident ) )
			{
				if (constraint.ident == fileParamName && constraint.kind == "fileExists")
					constraint.value = "'pathwithcontent/file1'";
				params[constraint.ident].push(constraint.value);
			}
		}
		console.log("\nFor function " + funcName + ":");
		var allPossibleValues = [];
		// adding default value for params with no constraints
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			if (params[paramName].length == 0)
				params[paramName].push('\'\'');
			allPossibleValues.push(_.uniq(params[paramName]));
			console.log("param: " + paramName + " Values: " + _.uniq(params[paramName]));
		}
		
		var cartesianProd = cartesianProductOf(allPossibleValues);
		console.log("cartesianProd length:" + cartesianProd.length);
		for (var i = 0; i < cartesianProd.length; i++) 
		{
			var args = Object.keys(cartesianProd[i]).map( 
						function(k) {return cartesianProd[i][k]; }).join(",");

			// Prepare function arguments.		
			if( pathExists || fileWithContent )
			{
				content += generateMockFsTestCases(pathExists,fileWithContent,funcName, args, false);
				// Bonus...generate constraint variations test cases....
				content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args, false);
				content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args, false);
				content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args, true);
			}
			else
			{
				// Emit simple test case.
				content += "subject.{0}({1});\n".format(funcName, args );
			}
		}
	}


	fs.writeFileSync('test.js', content, "utf8");

}

function generateMockFsTestCases (pathExists,fileWithContent,funcName,args, badPath) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && 
					(child.operator == "==" || child.operator == "!=" 
						|| child.operator == "<" || child.operator == ">"
						|| child.operator == "<=" || child.operator == ">="))
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1]);

						if (typeof(child.right.value) == 'number') {
							generateForNumber(funcName, expression, rightHand, child);
						}
						else if (typeof(child.right.value) == 'string') {
							generateForString(funcName, expression, rightHand, child);
						}
						else if (typeof(child.right.value) == 'undefined') {
							generateForUndefined(funcName, expression, rightHand, child);
						}
					}
					else if (child.left.type == "CallExpression" && 
								child.left.callee.property &&
								child.left.callee.property.name == "indexOf") 
					{
						var paramName = child.left.callee.object && child.left.callee.object.name;
						//console.log("indexOf for param:" + paramName);
						var expression = buf.substring(child.left.range[0], child.left.range[1]);
						//check if it is present in function params
						for( var p =0; p < params.length; p++ )
						{
							if(paramName == params[p]) {
								var strForIndexOf = buf.substring(child.left.arguments[0].range[0], 
									child.left.arguments[0].range[1]);
								functionConstraints[funcName].constraints.push( 
									new Constraint(
										{
											ident: params[p],
											value:  strForIndexOf,
											funcName: funcName,
											kind: "string",
											operator : "indexOf",
											expression: expression
										}));

								strForIndexOf = strForIndexOf.substring(0, strForIndexOf.length-1) 
													+ "INDEXOF\"";

								functionConstraints[funcName].constraints.push( 
									new Constraint(
										{
											ident: params[p],
											value:  strForIndexOf,
											funcName: funcName,
											kind: "string",
											operator : "indexOf",
											expression: expression
										}));
							}							
						}						
					}
					else if ( child.left.type == "Identifier" && child.left.name == "area") {
						areaCode = child.right.value;
					}
				}

				if( child.type === 'UnaryExpression' && child.operator == "!") 
				{
					if( child.argument.type == 'Identifier') 
					{
						for( var p =0; p < params.length; p++ )
						{
							if( child.argument.name == params[p] )
							{
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: params[p],
										value:  true,
										funcName: funcName,
										kind: "unary",
										operator : child.operator,
										expression: expression
									}));

								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: params[p],
										value:  false,
										funcName: funcName,
										kind: "unary",
										operator : child.operator,
										expression: expression
									}));
							}

						}
					}
					else if ( child.argument.type == 'MemberExpression') 
					{
						var argName = child.argument.object && child.argument.object.name;
						for( var p =0; p < params.length; p++ )
						{
							if( argName == params[p] )
							{
								var propertyName = child.argument.property && child.argument.property.name;
								var finalParamValue = {};								
								finalParamValue[propertyName] = false;
								//var finalParamValue = {argName:{propertyName:false}};
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: params[p],
										// A fake path to a file
										value:  JSON.stringify(finalParamValue),
										funcName: funcName,
										kind: "unary",
										operator : child.operator,
										expression: expression
									}));
								finalParamValue[propertyName] = true;
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: params[p],
										// A fake path to a file
										value:  JSON.stringify(finalParamValue),
										funcName: funcName,
										kind: "unary",
										operator : child.operator,
										expression: expression
									}));
							}
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));

							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/invalidDir'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));

						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="readdirSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{

							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
							
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExistsWithNoContents'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));

							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/invalidDir'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							fileParamName = params[p];
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathwithcontent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));

							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathwithcontent/file2'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

			});

			console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

/** 
function to generate conditions for numeric binary comparision
*/
function generateForNumber( funcName, expression, rightHand, child) {
	//console.log("Called for expr " + expression + " with rightHand " + rightHand);
	var intRightHand = parseInt(rightHand);
	functionConstraints[funcName].constraints.push( 
		new Constraint(
		{
			ident: child.left.name,
			value: rightHand,
			funcName: funcName,
			kind: "integer",
			operator : child.operator,
			expression: expression
		}));
	if (child.operator == ">" || child.operator == "<=")
		intRightHand = createConcreteIntegerValue(true, parseInt(intRightHand)+1);
	else
		intRightHand = createConcreteIntegerValue(false, parseInt(intRightHand)-1);

	functionConstraints[funcName].constraints.push(
		new Constraint(
		{
			ident: child.left.name,
			value: String(intRightHand),
			funcName: funcName,
			kind: "integer",
			operator : child.operator,
			expression: expression
		}));
}

/** 
function to generate conditions for string binary comparision
*/
function generateForString( funcName, expression, rightHand, child) {
	functionConstraints[funcName].constraints.push( 
		new Constraint(
		{
			ident: child.left.name,
			value: rightHand,
			funcName: funcName,
			kind: "string",
			operator : child.operator,
			expression: expression
		}));

	if (child.operator == "==")
		rightHand = rightHand.substring(0, rightHand.length-1) + "RANDOM\"";
	else if(child.operator == "!=")
		rightHand = rightHand.substring(0, rightHand.length-1) + "NOTEQUAL\"";

	functionConstraints[funcName].constraints.push( 
		new Constraint(
		{
			ident: child.left.name,
			value: rightHand,
			funcName: funcName,
			kind: "string",
			operator : child.operator,
			expression: expression
		}));
}

/** 
function to generate conditions for undefined
*/
function generateForUndefined( funcName, expression, rightHand, child) {
	functionConstraints[funcName].constraints.push( 
		new Constraint(
		{
			ident: child.left.name,
			value: rightHand,
			funcName: funcName,
			kind: "undefined",
			operator : child.operator,
			expression: expression
		}));

	functionConstraints[funcName].constraints.push( 
		new Constraint(
		{
			ident: child.left.name,
			value: 0,
			funcName: funcName,
			kind: "undefined",
			operator : child.operator,
			expression: expression
		}));
}


/**
Gives cartestian product of param combinations
reference: https://gist.github.com/ijy/6094414
*/
function cartesianProductOf() {
    return _.reduce(arguments[0], function(a, b) {
        return _.flatten(_.map(a, function(x) {
            return _.map(b, function(y) {
                return x.concat([y]);
            });
        }), true);
    }, [ [] ]);
};

main();
