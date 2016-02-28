/**
 * dom element를 현재 cursor caret 위치에 삽입
 * @param  {node}
 */
function insertNodeAtCursor(node) {
	var sel, range, node;
	if (window.getSelection) {
		sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			range = window.getSelection().getRangeAt(0);
			node = node;
			range.insertNode(node);
			/* 커서 위치를 삽입한 노드 뒤에 위치 시킨다 */
			range.setStartAfter(node);
			range.setEndAfter(node);
			sel.removeAllRanges();
			sel.addRange(range);
		}
	} else if (document.selection && document.selection.createRange) {
		document.selection.createRange().pasteHTML(html);
	}
}

/**
 * plain text를 현재 cursor caret 위치에 삽입
 * @param  {text}
 */
function insertTextAtCursor(text) {
	var sel, range, html;
	sel = window.getSelection();
	range = sel.getRangeAt(0);
	range.deleteContents();
	var textNode = document.createTextNode(text);
	range.insertNode(textNode);
	/* 커서 위치를 삽입한 노드 뒤에 위치 시킨다 */
	range.setStartAfter(textNode);
	range.setEndAfter(textNode);
	sel.removeAllRanges();
	sel.addRange(range);
}

function saveSelection(containerEl) {
	if (window.getSelection && document.createRange) {

		var range = window.getSelection().getRangeAt(0);
		var preSelectionRange = range.cloneRange();
		preSelectionRange.selectNodeContents(containerEl);
		preSelectionRange.setEnd(range.startContainer, range.startOffset);
		var start = preSelectionRange.toString().length;

		return {
			start: start,
			end: start + range.toString().length
		}
	} else if (document.selection && document.body.createTextRange) {

		var selectedTextRange = document.selection.createRange();
		var preSelectionTextRange = document.body.createTextRange();
		preSelectionTextRange.moveToElementText(containerEl);
		preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
		var start = preSelectionTextRange.text.length;

		return {
			start: start,
			end: start + selectedTextRange.text.length
		}
	}
}

function restortSelection(containerEl, savedSel) {
	if (window.getSelection && document.createRange) {
		var charIndex = 0,
			range = document.createRange();
		range.setStart(containerEl, 0);
		range.collapse(true);
		var nodeStack = [containerEl],
			node, foundStart = false,
			stop = false;

		while (!stop && (node = nodeStack.pop())) {
			if (node.nodeType == 3) {
				var nextCharIndex = charIndex + node.length;
				if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
					range.setStart(node, savedSel.start - charIndex);
					foundStart = true;
				}
				if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
					range.setEnd(node, savedSel.end - charIndex);
					stop = true;
				}
				charIndex = nextCharIndex;
			} else {
				var i = node.childNodes.length;
				while (i--) {
					nodeStack.push(node.childNodes[i]);
				}
			}
		}

		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.selection && document.body.createTextRange) {
		var textRange = document.body.createTextRange();
		textRange.moveToElementText(containerEl);
		textRange.collapse(true);
		textRange.moveEnd("character", savedSel.end);
		textRange.moveStart("character", savedSel.start);
		textRange.select();
	}
}

function getSelectedText() {
	var text = "";
	if (typeof window.getSelection != "undefined") {
		text = window.getSelection().toString();
	} else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
		text = document.selection.createRange().text;
	}
	return text;
}

function createCaretPlacer(atStart) {
	return function (el) {
		el.focus();
		if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
			var range = document.createRange();
			range.selectNodeContents(el);
			range.collapse(atStart);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		} else if (typeof document.body.createTextRange != "undefined") {
			var textRange = document.body.createTextRange();
			textRange.moveToElementText(el);
			textRange.collapse(atStart);
			textRange.select();
		}
	}
}
var placeCaretAtEnd = createCaretPlacer(false);
var placeCaretAtStart = createCaretPlacer(true);