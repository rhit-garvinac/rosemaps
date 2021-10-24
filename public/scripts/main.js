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
rhit.mapPageController = null;

rhit.MapPageController = class {
	constructor() {
		// Make the map image element draggable:
		rhit.dragElement(document.getElementById("map-img"));
		// TODO Make other elems draggable??
		//
		document.querySelector("#fab").addEventListener("click",(event) => {
			var map = document.getElementById("map-img")
			var currSrc = map.src;
			console.log(currSrc);
			if(currSrc.indexOf("images/Olin2.png") != -1){
				map.src = currSrc.replace("images/Olin2.png", "images/Olin1.png");
			} else if(currSrc.indexOf("images/Olin1.png") != -1){
				map.src = currSrc.replace("images/Olin1.png", "images/Olin2.png");
			} else {
				console.error("images " + currSrc + " not found");
			}
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

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	rhit.mapPageController = new rhit.MapPageController();
};

rhit.main();
