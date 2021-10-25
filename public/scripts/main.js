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
rhit.FB_KEY_ROOM = "room";
rhit.FB_KEY_DESC = "desc";
rhit.FB_KEY_AUTHOR = "author";
//rhit.FB_KEY_LAST_TOUCHED ="lastTouched";
rhit.mapPageController = null;

rhit.scaleFactor = 22/30; //0.73333333333333...

/** nodes */
//nodes[0] = floor 1 nodes, nodes[1] = floor 2 nodes, etc.
rhit.nodes = [
	[
		[916, 419, "O111"],
		[1617, 419, "O113"],
		[2121, 415, "O115"]
	],
	[
		//O227 (1340, 550) entrance
		//O227 (1205, 450) center
		[1205, 450, "O227"],
		[1534, 450, "O229"],
		[1855, 445, "O231"],
		[2197, 440, "O233"]
	]
	//TODO 😔
];

rhit.floor = 2;

/** classes and stuff */
rhit.MapPageController = class {
	constructor() {
		// Make the map image element draggable:
		rhit.dragElement(document.getElementById("map-viewport"));
		// TODO Make other elems draggable??
		//
		this._documentSnapshots = [];
	  	this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ANNOTATIONS);
	  	this._unsubscribe = null;

		document.querySelector("#menuPublicAnnotations").addEventListener("click",(event) => {
			window.location.href = "/annotations.html";
		});

		document.querySelector("#fab").addEventListener("click",(event) => {
			var map = document.getElementById("map-img")
			var currSrc = map.src;
			console.log(currSrc);
			if(currSrc.indexOf("images/Olin2.png") != -1){
				map.src = currSrc.replace("images/Olin2.png", "images/Olin1.png");
				rhit.floor = 1;
			} else if(currSrc.indexOf("images/Olin1.png") != -1){
				map.src = currSrc.replace("images/Olin1.png", "images/Olin2.png");
				rhit.floor = 2;
			} else {
				console.error("images " + currSrc + " not found");
			}
			this.displayNodes();
		});

		this.displayNodes();
	}

	displayNodes(){
		//display nodes
		const mapdiv = document.getElementById("map-viewport");
		while (mapdiv.childNodes.length > 3) {
			//children we don't remove: text node, img node, text node
			mapdiv.removeChild(mapdiv.lastChild);
		}
		rhit.nodes[rhit.floor - 1].forEach(node => 
		{//firebase room number query --> array of annotations for that room
		let query = this._ref.where(rhit.FB_KEY_ROOM, "==", node[2]);
		var annotations = [];
		query.onSnapshot((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				var annotation = new rhit.Annotation(
					doc.id,
					doc.get(rhit.FB_KEY_AUTHOR),
					doc.get(rhit.FB_KEY_ROOM),
					doc.get(rhit.FB_KEY_DESC),

				);
				annotations.push(annotation);
			});

			//IMPORTANT NOTE: Do NOT give any html elems a room id e.g. id="O227"
			//These ids will be used programmatically by this function
			let elem = null;

			if(annotations.length == 0){
				elem = htmlToElement(`<button id=${node[2]} class="btn" style="position:absolute; top:${node[1]}px; left:${node[0]}px">
								<i class="material-icons">place</i>
							</button>`);
			} else {
				elem = htmlToElement(`<button id=${node[2]} class="btn" style="position:absolute; top:${node[1]}px; left:${node[0]}px">
								<i class="material-icons">comment</i>
							</button>`);
				elem.addEventListener("click", function(e){console.log(annotations);});
			}
			mapdiv.appendChild(elem);
			});
		});
	}
}

//Draggable Element code from https://www.w3schools.com/howto/howto_js_draggable.asp
rhit.dragElement = function(elmnt) {
  var deltaX = 0, deltaY = 0, prevX = 0, prevY = 0;
	elmnt.onmousedown = dragMouseDown;
	elmnt.addEventListener("touchstart",  function(e) {dragTouchDown(e)});

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    prevX = e.clientX;
    prevY = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementClickDrag;
  }

  function dragTouchDown(e) {
	e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
	touch = e.touches[0];
    prevX = touch.clientX;
    prevY = touch.clientY;
	document.ontouchend = closeDragElement;
    // call a function whenever the cursor moves:
	document.ontouchmove = elementTouchDrag;
  }

  function elementClickDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    deltaX = prevX - e.clientX;
    deltaY = prevY - e.clientY;
    prevX = e.clientX;
    prevY = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - deltaY) + "px";
    elmnt.style.left = (elmnt.offsetLeft - deltaX) + "px";
  }

  function elementTouchDrag(e) {
    e = e || window.event;
    e.preventDefault();
	touch = e.touches[0];
    // calculate the new cursor position:
    deltaX = prevX - touch.clientX;
    deltaY = prevY - touch.clientY;
    prevX = touch.clientX;
    prevY = touch.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - deltaY) + "px";
    elmnt.style.left = (elmnt.offsetLeft - deltaX) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
	document.ontouchend = null;
    document.onmousemove = null;
	document.ontouchmove = null;
  }
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
	constructor(id, room, desc){
		this.id = id;
		this.room = room;
		this.desc = desc;
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	rhit.mapPageController = new rhit.MapPageController();
};

rhit.main();
