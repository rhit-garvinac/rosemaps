/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Andre Battle
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_ANNOTATIONS = "annotations";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_ROOM = "room";
rhit.FB_KEY_DESC = "desc";
rhit.fbAnnotationsManager = null;
rhit.fbAnnotationManager = null;

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Annotation = class {
	constructor(id, author, room, desc) {
		this.id = id,
		this.author = author;
		this.room = room;
		this.desc = desc;
	}
}

rhit.FbAnnotationsManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._unsubscribe = null;

		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_ROOM, "desc")
			.limit(50).onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				if (changeListener) {
					changeListener();
				}
			});
	}
	stopListening() {
		this._unsubscribe();
	}

	add(room, desc) {
		this._ref.add({
				[rhit.FB_KEY_AUTHOR]: "test",
				[rhit.FB_KEY_ROOM]: room,
				[rhit.FB_KEY_DESC]: desc,
			})
			.then(function (docRef) {
				console.log("Document added with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}

	update(id, room, desc) {}
	delete(id) {}
	get length() {
		return this._documentSnapshots.length;
	}
	getAnnotationAtIndex(index) {
		const doc = this._documentSnapshots[index];
		return new rhit.Annotation(doc.id, doc.get(rhit.FB_KEY_AUTHOR), doc.get(rhit.FB_KEY_ROOM), doc.get(rhit.FB_KEY_DESC));
	}
}

rhit.ListPageController = class {
	constructor() {

		rhit.fbAnnotationsManager.beginListening(this.updateList.bind(this));

		$("#addAnnotationDialog").on("show.bs.modal", () => {
			document.querySelector("#inputRoom").value = "";
			document.querySelector("#inputDesc").value = "";
		});

		$("#addAnnotationDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputRoom").focus();
		});

		$("#editAnnotationDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputEditRoom").focus();
		});

		document.querySelector("#submitAddAnnotation").addEventListener("click", (event) => {
			const room = document.querySelector("#inputRoom").value;
			const desc = document.querySelector("#inputDesc").value;
			rhit.fbAnnotationsManager.add(room, desc);
		});

		document.querySelector("#submitEditAnnotation").addEventListener("click", (event) => {
			const room = document.querySelector("#inputEditRoom").value;
			const desc = document.querySelector("#inputEditDesc").value;
			console.log(room);
			rhit.fbAnnotationManager.update(room, desc);
		});

		document.querySelector("#submitDeleteAnnotation").addEventListener("click", (event) => {
			rhit.fbAnnotationManager.delete().then(() => {
					window.location.href = "/annotations.html"; 
			});;
		});

	}
	updateList() {
		const newList = htmlToElement("<div id='annotationListContainer'></div>")
		for (let k = 0; k < rhit.fbAnnotationsManager.length; k++) {
			const annotation = rhit.fbAnnotationsManager.getAnnotationAtIndex(k);
			const newCard = this._createCard(annotation);
			newCard.onclick = (event) => {
				rhit.fbAnnotationManager = new rhit.FbAnnotationManager(annotation.id);
				rhit.fbAnnotationManager.beginListening(function() {return null});
				// window.location.href = `/annotation.html?id=${annotation.id}`;
			};
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#annotationListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

	_createCard(annotation) {
		return htmlToElement(`<div id="${annotation.id}" class="card">
			<div class="d-flex justify-content-between">
				<div class="card-info">
					<h2 class="card-room">Room: ${annotation.room}</h2>
					<div class="card-author">Author: ${annotation.author}</div>
					<div class="card-desc">Description: ${annotation.desc}</div>
		
				</div>
				<div class="card-buttons">
					<button type="button" class="btn bmd-btn-fab card-btn" data-toggle="modal" data-target="#editAnnotationDialog">
						<i class="material-icons">edit</i>
					</button>
					<button type="button" class="btn bmd-btn-fab card-btn" data-toggle="modal" data-target="#deleteAnnotationDialog">
						<i class="material-icons">delete</i>
					</button>
				</div>
			</div>
	</div>`);
	}
}


rhit.FbAnnotationManager = class {
	constructor(annotationId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS).doc(annotationId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._document = doc;
				changeListener();
			} else {
				console.log("Document does not exist any longer.");
				console.log("CONSIDER: automatically navigate back to the home page.");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}
	get author() {
		return this._document.get(rhit.FB_KEY_AUTHOR);
	}

	get room() {
		return this._document.get(rhit.FB_KEY_ROOM);
	}

	get desc() {
		return this._document.get(rhit.FB_KEY_DESC);
	}


	update(room, desc) {
		this._ref.update({
			[rhit.FB_KEY_AUTHOR]: "",
			[rhit.FB_KEY_ROOM]: room,
			[rhit.FB_KEY_DESC]: desc,
		}).then(() => {
			console.log("Document has been updated");
		});
	}
	delete() {
		return this._ref.delete();
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	if (document.querySelector("#listPage")) {
		rhit.fbAnnotationsManager = new rhit.FbAnnotationsManager();
		new rhit.ListPageController();
	}
};

rhit.main();