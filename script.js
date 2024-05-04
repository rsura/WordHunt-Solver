submitBtn = document.getElementById("submit-btn");
element_grid = [];
graph_grid = [];
elements_row = [];
all_current_paragraphs = [];
minWordSize = 3;
maxWordSize = 9;
print = console.log;
length_scores = {9:2600,8:2200,7:1800,6:1400,5:800,4:400,3:100};

word_set = {};
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://raw.githubusercontent.com/rsura/WordHunt-Solver/main/EnglishWords.txt', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    arr = xhr.responseText.split("\n");
	for(let i = 0; i < arr.length; i++){
		word_set[arr[i]] = true;
	}
  }
};
xhr.send();

class GraphNode {
	constructor(value, row, col, element) {
		this.val = value;
		this.row = row;
		this.col = col;
		this.element = element;
		this.nodesConnectedTo = new Set();
	}

	getConnectedNodes() {
		return new Set([...this.nodesConnectedTo]);
	}

	connectToNode(g) {
		if (this === g || g === null) {
			return false;
	  	}
	  	if (typeof this.val !== typeof g.val) {
			throw new Error("GraphNodes are of different DataTypes!");
	  	}
	  	this.nodesConnectedTo.add(g);
	  	return true;
	}

	static connectNodes(g1, g2) {
	  	if (g1 === null || g2 === null) return false;

	  	if (typeof g1.val !== typeof g2.val) {
			throw new Error("Graph nodes are not of the same type!");
	  	}
	  	if (g1 === g2) {
			throw new Error("Can't connect the same node into itself");
	  	}
	  	g1.connectToNode(g2);
	  	g2.connectToNode(g1);
	  	return true;
	}

	toString() {
	  	let connectedNodes = Object.values(this.nodesConnectedTo);
	  	let sb =
			"GraphNode(" +
			this.val +
			") connected to " +
			connectedNodes.length +
			" GraphNodes: (";

	  	connectedNodes.forEach(node => {
			sb += node.val + ", ";
	  	});
	  	sb = sb.slice(0, -2);
	  	sb += ")";
	  	return sb;
	}

	equals(o) {
	  	if (this === o) return true;
	  	if (o === null || this.constructor !== o.constructor) return false;
	  	let graphNode = o;
	  	return this.val === graphNode.val && this.nodesConnectedTo === graphNode.nodesConnectedTo;
	}
}

class Path{
	constructor(copy) {
		if (copy == null){
			this.nodes = [];
			this.string = '';
			this.coordinates = [];
		} else {
			this.nodes = copy.nodes.slice();
			this.string = copy.string.slice();
			this.coordinates = [];
			for(let coord of copy.coordinates){
				this.coordinates.push(coord.slice());
			}
		}
	}
	addNode(g){
		this.nodes.push(g);
		this.string += g.val;
		this.coordinates.push([g.row, g.col]);
	}
}

function drawPath(p){
	x_col_num_vals = [40,125,205,290]
	y_row_num_vals = [40,125,200,280]
	function drawLine(x1, y1, x2, y2, color){
		const canvas = document.createElement("canvas");
		canvas.width = 340;
		canvas.height = 350;
		canvas.style.backgroundColor = "transparent";

		const ctx = canvas.getContext("2d");
		ctx.strokeStyle = color;
		ctx.lineWidth = 7;

		ctx.beginPath();
		ctx.moveTo(x_col_num_vals[y1],y_row_num_vals[x1]);
		ctx.lineTo(x_col_num_vals[y2],y_row_num_vals[x2]);
		ctx.stroke();

		document.getElementById("grid").appendChild(canvas);
	}
	for(let i = 0; i < p.coordinates.length - 1; i++){
		drawLine(p.coordinates[i][0], p.coordinates[i][1], p.coordinates[i + 1][0], p.coordinates[i + 1][1], "#ff0000");
	}
}

function run(){
	start();

	// Check input
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			if (!(element_grid[i][j].value != null && element_grid[i][j].value.length == 1 && element_grid[i][j].value.match(/^[A-Za-z]+$/))){
				print('Invalid Inputs');
				return;
			}
			element_grid[i][j].value = element_grid[i][j].value.toLowerCase();
		}
	}

	// Make GraphNodes
	for (let i = 0; i < 4; i++) {
		let row = [];
		for (let j = 0; j < 4; j++) {
			let node = new GraphNode(element_grid[i][j].value,i,j, element_grid[i][j]);
			row.push(node);
		}
		graph_grid.push(row);
	}

	// Uppercase the letters
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			element_grid[i][j].value = element_grid[i][j].value.toUpperCase();
		}
	}

	// Make grid connections
	const _offsets = [-1,0,1];
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			for(let m of _offsets){
				for(let n of _offsets){
					if (m === 0 && n === 0){
						continue;
					}
					try{
						graph_grid[i][j].connectToNode(graph_grid[i+m][j+n]);
					} catch (e){}
				}
			}
		}
	}

	word_path_dict = {};
	function searchWords(node, nodesVisited, path) {
		if (node == undefined) return;
		nodesVisited.add(node);
		path.addNode(node);
		if (path.string.length > maxWordSize){
			return;
		}
		if (word_set[path.string] === true && !word_path_dict.hasOwnProperty(path.string) && path.string.length >= minWordSize) {
			word_path_dict[path.string] = path;
		}
		for (let nextNode of node.getConnectedNodes()) {
			if (!nodesVisited.has(nextNode)) {
				searchWords(nextNode, new Set([...nodesVisited]), new Path(path));
			}
		}
	}

	function getAllWords(characterNodes) {
		for (let characterNodeList of characterNodes) {
			for (let node of characterNodeList) {
				searchWords(node, new Set(), new Path(null));
			}
		}
		let al = Object.keys(word_path_dict);
		al.sort((o1, o2) => o2.length - o1.length);
		return al;
	}

	found_words = getAllWords(graph_grid);
	const wordListDiv = document.getElementById("wordList");
	if (found_words.length === 0){
		wordListDiv.innerHTML += `<br/><br/><br/><br/><br/><h2 style="color: red; width: fit-content; padding: 15px; border-radius: 5px"> ERROR: NO WORDS FOUND</h2>`;
		document.getElementById('clear-btn').focus();
		return;
	}
	wordListDiv.innerHTML += `<h2 style = "background-color: #648f61;">Words Found:</h2>`;
	let curr_word_length = found_words[0].length + 1;
	let currWordDiv;
	for (let word of found_words){
		if (word.length < curr_word_length){
			curr_word_length = word.length;
			wordListDiv.innerHTML += `<div id = "word_length_${curr_word_length}" class = "word_length_category"></div>`;
			currWordDiv = document.getElementById(`word_length_${curr_word_length}`);
			currWordDiv.innerHTML += `<h2>${curr_word_length}-letter words (+${length_scores[curr_word_length]})</h2>`
		}
		currWordDiv.innerHTML += `<p>${word.toUpperCase()}</p>`;
	}
	var paragraphs = document.querySelectorAll("p");
	paragraphs.forEach(function(paragraph) {
		all_current_paragraphs.push(paragraph);
		paragraph.addEventListener("mouseover", function() {
			drawPath(word_path_dict[paragraph.innerText.toLowerCase()])
		});
		paragraph.addEventListener("mouseout", function() {
			var canvases = document.querySelectorAll("canvas");
			canvases.forEach(function(canvas) {
				canvas.remove();
			});
		});
	});
	if(all_current_paragraphs.length == 0){
		submitBtn.focus();
	} else {
		document.getElementById('clear-btn').focus();
	}

}

function check_and_move(event, element){
	function getNextValue(elem){
		for(let i = 0; i < 16; i++){
			if (elem === elements_row[i]){
				return elements_row[i+1];
			}
		}
	}

	var input = event.target.value;
    var valid_char = input.match(/^[A-Za-z]+$/);
	var valid_len = (input.length == 1);
    if (!(valid_char && valid_len)) {
		event.target.value = '';
		return;
    } else {
		if (element.value.length === element.maxLength) {
			getNextValue(element).focus();
		} else {
			element.value = '';
		}
	}
}

function clear_input(){
	var canvases = document.querySelectorAll("canvas");
	canvases.forEach(function(canvas) {
		canvas.remove();
	});
	const element = document.getElementById("wordList");
	if (element) {
  		element.remove();
	}
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			element_grid[i][j].value = '';
		}
	}
	element_grid[0][0].focus();
}


//--------------------START--------------------
function start(){
	const element = document.getElementById("wordList");
	if (element) {
  		element.remove();
	}
	const newDiv = document.createElement("div");
	newDiv.id = "wordList";

	document.getElementById("this_script").parentNode.insertBefore(newDiv, document.getElementById("this_script"));
	// document.body.appendChild(newDiv);

	element_grid = [];
	graph_grid = [];
	elements_row = [];

	for (let i = 0; i < 4; i++) {
		let row = [];
		for (let j = 0; j < 4; j++) {
			let cell = document.getElementById(`cell-${i}-${j}`);
			document.getElementById(`cell-${i}-${j}`).addEventListener('focus', () => {
				document.getElementById(`cell-${i}-${j}`).select();
			})
			elements_row.push(cell);
			row.push(cell);
		}
		element_grid.push(row);
	}
	elements_row.push(submitBtn);
	elements_row[0].focus();
}

start();