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
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_DESC = "desc";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_POSITION = "position";
rhit.FB_KEY_BUILDING = "building";
rhit.FB_COLLECTION_USERS = "users";
rhit.fbAnnotationsManager = null;
rhit.fbAnnotationManager = null;

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Annotation = class {
	constructor(id, author, title, building, desc, position){
		this.id = id;
		this.author = author;
		this.title = title;
		this.building = building;
		this.desc = desc;
		this.position = position;
	}
}

rhit.FbAnnotationsManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._unsubscribe = null;

		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_BUILDING, "desc")
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
	update(title, desc) {}
	delete(desc) {}
	get length() {
		return this._documentSnapshots.length;
	}
	getAnnotationAtIndex(index) {
		const doc = this._documentSnapshots[index];
		return new rhit.Annotation(doc.id, doc.get(rhit.FB_KEY_AUTHOR), doc.get(rhit.FB_KEY_TITLE), 
			doc.get(rhit.FB_KEY_BUILDING), doc.get(rhit.FB_KEY_DESC), doc.get(rhit.FB_KEY_POSITION));
	}
}

rhit.ListPageController = class {
	constructor() {

		rhit.fbAnnotationsManager.beginListening(this.updateList.bind(this));

		$("#editAnnotationDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputEditTitle").focus();
		});

		document.querySelector("#submitEditAnnotation").addEventListener("click", (event) => {
			const title = document.querySelector("#inputEditTitle").value;
			const desc = document.querySelector("#inputEditDesc").value;
			rhit.fbAnnotationManager.update(title, desc);
		});

		document.querySelector("#submitDeleteAnnotation").addEventListener("click", (event) => {
			rhit.fbAnnotationManager.delete().then(() => {
				const urlParams = new URLSearchParams(window.location.search);
				window.location.href = "/annotations.html?user=" + urlParams.get("user");; 
			});;
		});

	}
	updateList() {
		const newList = htmlToElement("<div id='annotationListContainer'></div>")
		for (let k = 0; k < rhit.fbAnnotationsManager.length; k++) {
			const annotation = rhit.fbAnnotationsManager.getAnnotationAtIndex(k);
			const urlParams = new URLSearchParams(window.location.search);
			const user = urlParams.get("user");
			var newCard;
			if (user == null){
				newCard = this._createCard(annotation);
				newCard.onclick = (event) => {
					rhit.fbAnnotationManager = new rhit.FbAnnotationManager(annotation.id);
					rhit.fbAnnotationManager.beginListening(function() {return null});
				};
			} 
			
			if(user == annotation.author) {
				newCard = this._createEditCard(annotation);
				newCard.onclick = (event) => {
					rhit.fbAnnotationManager = new rhit.FbAnnotationManager(annotation.id);
					rhit.fbAnnotationManager.beginListening(function() {return null});
				};
			}
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
					<h2 class="card-room">Title: ${annotation.title}</h2>
					<div class="card-author">Author: ${annotation.author}</div>
					<div class="card-desc">Building: ${annotation.building}</div>
					<div class="card-desc">Description: ${annotation.desc}</div>
		
				</div>
			</div>
	</div>`);
	}

	_createEditCard(annotation) {
		return htmlToElement(`<div id="${annotation.id}" class="card">
			<div class="d-flex justify-content-between">
				<div class="card-info">
					<h2 class="card-room">Title: ${annotation.title}</h2>
					<div class="card-author">Author: ${annotation.author}</div>
					<div class="card-desc">Building: ${annotation.building}</div>
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

	get title() {
		return this._document.get(rhit.FB_KEY_TITLE);
	}

	get building() {
		return this._document.get(rhit.FB_KEY_BUILDING);
	}

	get desc() {
		return this._document.get(rhit.FB_KEY_DESC);
	}
	
	get position() {
		return this._document.get(rhit.FB_KEY_POSITION);
	}


	update(title, desc) {
		this._ref.update({
			[rhit.FB_KEY_AUTHOR]: firebase.auth().currentUser.uid,
			[rhit.FB_KEY_TITLE]: title,
			[rhit.FB_KEY_BUILDING]: this.building,
			[rhit.FB_KEY_DESC]: desc,
			[rhit.FB_KEY_POSITION]: this.position,
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