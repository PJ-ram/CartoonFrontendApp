/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/tolaram/app/pp/zppcartoncreat/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});