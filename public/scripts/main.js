
/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Campbell Garvin
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_ANNOTATIONS = "annotations";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_DESC = "desc";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_POSITION = "position";
rhit.FB_KEY_BUILDING = "building";
rhit.FB_COLLECTION_USERS = "users";
//rhit.FB_KEY_LAST_TOUCHED ="lastTouched";
rhit.mapPageController = null;
rhit.AuthManager = null;
rhit.UserManaer = null;
rhit.scaleFactor = 22/30; //0.73333333333333...


/** classes and stuff */
rhit.MapPageController = class {
	constructor() {
		const controller = this;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS);
		this._unsubscribe = null;
		// Instantiate EasyZoom instances
		var $easyzoom = $('.easyzoom').easyZoom();
		var zoomed = false; var addComment = false;
		// Get an instance API
		var api = $easyzoom.filter('.easyzoom--with-toggle').data('easyZoom');
		 
		const urlParams = new URLSearchParams(window.location.search);
		const buildingName = urlParams.get("buildings");
		var elem = htmlToElement(`<div href="images/${buildingName}.png" 
					data-standard="images/${buildingName}.png">
					<img class="toggle" id="mainMap" 
					src="images/${buildingName}.png" alt="map"> </div>`);
		elem.href = `images/${buildingName}.png`;
		api.swap(elem.dataset.standard, elem.href);
		api.teardown();

		$("#addAnnotationDialog").on("show.bs.modal", () => {
			document.querySelector("#inputTitle").value = "";
			document.querySelector("#inputDesc").value = "";
		});

		$("#addAnnotationDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputTitle").focus();
		});
		var title = null, desc = null;
		document.querySelector("#submitAddAnnotation").addEventListener("click", (event) => {
			title = document.querySelector("#inputTitle").value;
			desc = document.querySelector("#inputDesc").value;
		});

		$('.toggle').on('click', function(e) {
			if (addComment) {
				this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS);
				var posX = $(this).offset().left, posY = $(this).offset().top;
				posX = e.pageX - posX, posY = e.pageY - posY;
				var scaleX = Math.round((posX/$(this).width()) * 100), scaleY = Math.round((posY/$(this).height()) * 100);
				const urlParams = new URLSearchParams(window.location.search);
				
				if (title) {
					console.log(rhit.AuthManager.uid);
					this._ref.add({
						[rhit.FB_KEY_AUTHOR]: rhit.AuthManager.uid,
						[rhit.FB_KEY_TITLE]: title,
						[rhit.FB_KEY_BUILDING]: urlParams.get("buildings"),
						[rhit.FB_KEY_DESC]: desc,
						[rhit.FB_KEY_POSITION]: [scaleY, scaleX]
					})
					.then(function (docRef) {
						console.log("Document added with ID: ", docRef.id);
						title = null, desc = null;
						controller.displayNodes();
					})
					.catch(function (error) {
						console.error("Error adding document: ", error);
					});
					var mapOverlay = document.getElementsByClassName("bmd-layout-content")[0];
					var dropDown = document.getElementById("drop-down");
					dropDown.style.opacity = 1;
					mapOverlay.removeChild(mapOverlay.lastChild);
					addComment = false;
				}

		   }
		   else {
			   if (zoomed == false) {
				   zoomed = true;
				   api._init();
			   } else {
				   zoomed = false;
				   api.teardown();
			   }
		   }
		   });
		
		document.querySelector("#fab").addEventListener("click",(event) => {
			var elem = htmlToElement(`<div id="clickpane"> Click anywhere to add an Annotation </div>`);
			var mapOverlay = document.getElementsByClassName("bmd-layout-content")[0];
			var dropDown = document.getElementById("drop-down");
			dropDown.style.opacity = 0;
			mapOverlay.appendChild(elem);
			addComment = true;
		});

		this.displayNodes();
	}

	displayNodes(){
		//display nodes
		const annotations = document.getElementById("annotationList");
		while (annotations.childNodes.length != 0) {
			annotations.removeChild(annotations.lastChild);
		}
		this._ref.get().then((snapshot) => {
			snapshot.docs.map(doc => {
				var annotation = new rhit.Annotation(
					doc.get(rhit.FB_KEY_AUTHOR),
					doc.get(rhit.FB_KEY_TITLE),
					doc.get(rhit.FB_KEY_BUILDING),
					doc.get(rhit.FB_KEY_DESC),
					doc.get(rhit.FB_KEY_POSITION)
				);
				const urlParams = new URLSearchParams(window.location.search);
				if (annotation.building == urlParams.get("buildings")){
					console.log(doc);
					var elem = htmlToElement(`<button class="btn btn-color" data-toggle="modal"
					data-target="#viewAnnotation" style="position:absolute;
					top:${annotation.position[0]}%; left:${annotation.position[1]}%; z-index: 100;">
					<i class="material-icons">comment</i> </button>`);
					elem.addEventListener("click", function(e){
						document.querySelector("#annotationTitle").innerText = annotation.title;
						document.querySelector("#annotationDesc").innerText = annotation.desc;
						document.querySelector("#annotationAuth").innerText = annotation.author;
					});
					annotations.appendChild(elem);
				}
			});
		});
	}
}

rhit.SideNavController = class {
  constructor(){
	const allAnnotations = document.querySelector("#allAnnotations");
		if (allAnnotations) {
			allAnnotations.addEventListener("click", (event) => {
				window.location.href = "/annotations.html";
			});
		}
	const myAnnotations = document.querySelector("#myAnnotations");
		if (myAnnotations) {
			myAnnotations.addEventListener("click", (event) => {
				window.location.href = "/annotations.html?user=" + rhit.AuthManager.uid;
			});
		}
    const menuSignOutItem = document.querySelector("#menuSignOut");
 		if (menuSignOutItem) {
 			menuSignOutItem.addEventListener("click", (event) => {
 				rhit.AuthManager.signOut();
 			});
 		}
  }
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.AuthManager.signIn();
		};
	}
}

rhit.AuthManager = class {
	constructor() {
		this._user = null;
		this._name = "";
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		console.log("Sign in using Rosefire");
		Rosefire.signIn("bd7cf5b7-2d50-48c3-8584-9c98090b828d", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);
			this._name = rfUser.name;
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});

	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}

	get name() {
		return this._name || this._user.displayName;
	}
}

rhit.UserManager = class {
	constructor() {
		this._collectoinRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._document = null;
		this._unsubscribe = null;
	}
	addNewUserMaybe(uid, name) {
		const userRef = this._collectoinRef.doc(uid);
		return userRef.get().then((doc) => {
			if (doc.exists) {
				console.log("User already exists:", doc.data());
				return false;
			} else {
				console.log("Creating this user!");
				return userRef.set({
						[rhit.FB_KEY_NAME]: name,
					})
					.then(function () {
						console.log("Document successfully written!");
						return true;
					})
					.catch(function (error) {
						console.error("Error writing document: ", error);
					});
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}
	beginListening(uid, changeListener) {
		const userRef = this._collectoinRef.doc(uid);
		this._unsubscribe = userRef.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._document = doc;
				changeListener();
			} else {
				console.log("No User!  That's bad!");
			}
		});

	}
	stopListening() {
		this._unsubscribe();
	}

	get isListening() {
		return !!this._unsubscribe;
	}

	get name() {
		return this._document.get(rhit.FB_KEY_NAME);
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.AuthManager.isSignedIn) {
		window.location.href = "/index.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.AuthManager.isSignedIn) {
		window.location.href = "/login.html";
	}
};

rhit.initializePage = function () {
	new rhit.SideNavController();
	if (document.querySelector(".easyzoom")) {
		rhit.mapPageController = new rhit.MapPageController();
	}
	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}
};

rhit.createUserObjectIfNeeded = function () {
	return new Promise((resolve, reject) => {
		if (!rhit.AuthManager.isSignedIn) {
			console.log("No user.  So no User check needed");
			resolve(false);
			return;
		}
		if (!document.querySelector("#loginPage")) {
			console.log("Not on login page.  So no User check needed");
			resolve(false);
			return;
		}
		console.log("Checking user");
		rhit.UserManager.addNewUserMaybe(
			rhit.AuthManager.uid,
			rhit.AuthManager.name,
		).then((isUserNew) => {
			resolve(isUserNew);
		});
	});
}

function htmlToElement(html){
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Node = class {
	constructor(x, y, annotations){
		this.x = x;
		this.y = y; 
		this.annotations = annotations;
	}
}

rhit.Annotation = class {
	constructor(author, title, building, desc, position){
		this.author = author;
		this.title = title;
		this.building = building;
		this.desc = desc;
		this.position = position;
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
  rhit.AuthManager = new rhit.AuthManager();
  rhit.UserManager = new rhit.UserManager();
  rhit.AuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.AuthManager.isSignedIn);
		rhit.createUserObjectIfNeeded().then(() => {
			rhit.checkForRedirects();
			rhit.initializePage();
		});
	});
};

rhit.main();