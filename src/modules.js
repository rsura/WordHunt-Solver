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