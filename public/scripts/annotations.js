/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.ClassName = class {
	constructor() {
		document.querySelector("#submitHistory").addEventListener("click",(event) => {
			console.log("clicked History")
		});

		document.querySelector("#submitAnnotation").addEventListener("click",(event) => {
			console.log("clicked Annotation")
		});

		$('#Annotation').on('show.bs.modal', (event) => {
			console.log("Annotation Modal Appearing")

		});

		$('#History').on('show.bs.modal', (event) => {
			console.log("History Modal Appearing")		});
	}
	methodName() {

	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	new rhit.ClassName();
};

rhit.main();
