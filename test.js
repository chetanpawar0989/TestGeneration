var subject = require('./subject.js')
var mock = require('mock-fs');
subject.inc(0,undefined);
subject.inc(0,0);
subject.inc(-10,undefined);
subject.inc(-10,0);
subject.weird(7,0,42,"strict");
subject.weird(7,0,42,"strictRANDOM");
subject.weird(7,0,42,"werw");
subject.weird(7,0,42,"werwINDEXOF");
subject.weird(7,0,42,"strictNOTEQUAL");
subject.weird(7,0,36,"strict");
subject.weird(7,0,36,"strictRANDOM");
subject.weird(7,0,36,"werw");
subject.weird(7,0,36,"werwINDEXOF");
subject.weird(7,0,36,"strictNOTEQUAL");
subject.weird(7,-3,42,"strict");
subject.weird(7,-3,42,"strictRANDOM");
subject.weird(7,-3,42,"werw");
subject.weird(7,-3,42,"werwINDEXOF");
subject.weird(7,-3,42,"strictNOTEQUAL");
subject.weird(7,-3,36,"strict");
subject.weird(7,-3,36,"strictRANDOM");
subject.weird(7,-3,36,"werw");
subject.weird(7,-3,36,"werwINDEXOF");
subject.weird(7,-3,36,"strictNOTEQUAL");
subject.weird(16,0,42,"strict");
subject.weird(16,0,42,"strictRANDOM");
subject.weird(16,0,42,"werw");
subject.weird(16,0,42,"werwINDEXOF");
subject.weird(16,0,42,"strictNOTEQUAL");
subject.weird(16,0,36,"strict");
subject.weird(16,0,36,"strictRANDOM");
subject.weird(16,0,36,"werw");
subject.weird(16,0,36,"werwINDEXOF");
subject.weird(16,0,36,"strictNOTEQUAL");
subject.weird(16,-3,42,"strict");
subject.weird(16,-3,42,"strictRANDOM");
subject.weird(16,-3,42,"werw");
subject.weird(16,-3,42,"werwINDEXOF");
subject.weird(16,-3,42,"strictNOTEQUAL");
subject.weird(16,-3,36,"strict");
subject.weird(16,-3,36,"strictRANDOM");
subject.weird(16,-3,36,"werw");
subject.weird(16,-3,36,"werwINDEXOF");
subject.weird(16,-3,36,"strictNOTEQUAL");
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExists','pathwithcontent/file1');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExists','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/fileExists','pathwithcontent/file1');
mock.restore();
mock({});
	subject.fileTest('path/fileExists','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExists','pathwithcontent/file2');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExists','pathwithcontent/file2');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/fileExists','pathwithcontent/file2');
mock.restore();
mock({});
	subject.fileTest('path/fileExists','pathwithcontent/file2');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/invalidDir','pathwithcontent/file1');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/invalidDir','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/invalidDir','pathwithcontent/file1');
mock.restore();
mock({});
	subject.fileTest('path/invalidDir','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/invalidDir','pathwithcontent/file2');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/invalidDir','pathwithcontent/file2');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/invalidDir','pathwithcontent/file2');
mock.restore();
mock({});
	subject.fileTest('path/invalidDir','pathwithcontent/file2');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file1');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file1');
mock.restore();
mock({});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file1');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{},"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file2');
mock.restore();
mock({"pathwithcontent":{"file1":"text content","file2":""}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file2');
mock.restore();
mock({"path/fileExists":{"file1":""},"path/fileExistsWithNoContents":{}});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file2');
mock.restore();
mock({});
	subject.fileTest('path/fileExistsWithNoContents','pathwithcontent/file2');
mock.restore();
subject.normalize('');
subject.normalize('212.937.8441');
subject.normalize('507.757.2195');
subject.format('','',true);
subject.format('','',false);
subject.format('','',{"normalize":false});
subject.format('','',{"normalize":true});
subject.format('212.746.7923','',true);
subject.format('212.746.7923','',false);
subject.format('212.746.7923','',{"normalize":false});
subject.format('212.746.7923','',{"normalize":true});
subject.format('1-332-572-0265','',true);
subject.format('1-332-572-0265','',false);
subject.format('1-332-572-0265','',{"normalize":false});
subject.format('1-332-572-0265','',{"normalize":true});
subject.blackListNumber('');
subject.blackListNumber('212.445.7562');
subject.blackListNumber('(914) 780-3011 x0107');
