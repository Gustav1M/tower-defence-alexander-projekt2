/**
 * Finds the shortest path in an unweighted graph g from a start node s to a terminal node t using breadth-first search (BFS).
 *
 * The graph g must provide the following interface:
 *   - g.numberOfNodes()       total number of nodes (used as the queue size)
 *   - g.key(n)                a unique string key for a node n
 *   - g.identicalNodes(a, b)  true if nodes n and m represent the same node
 *   - g.neighbors(n)          array of nodes reachable from n in one step

 * 
 * The type of a node is not fixed here: it is defined by the graph type of g, so any node representation is allowed as long as the graph supports it.
 * 
 * @template TNode
 * @param {TNode} s - Start node
 * @param {TNode} t - Terminal node
 * @param {object} g  - Graph object with the methods numberOfNodes(), key(), identicalNodes() and neighbors().
 * @returns {TNode[]} An array of nodes forming the shortest path from s to t,
 *   Returns an empty array if no path from s to t exists.
 */
function shortestPathBFS(s,t,g) {
    let path = [];
    let visitedSet = new Set();
    let prevMap = new Map();
    // Let Q be a Queue of length at least equal to the number of nodes in G.
    let q = new Queue(g.numberOfNodes());

//   Let Q be a Queue of length at least equal to the number of nodes in G.
//     Add s to Q.
    q.enqueue(s)                // add s to Q
    while (!q.isEmpty()){        //     While Q is not empty
        let n = q.dequeue()   //Let n be the front node of Q and remove it from Q.
        if (g.identicalNodes(n,t)){//if n is the terminal node t:
            path.push(t)    //push t to the list path
    
            let m = prevMap.get(g.key(t));
            path.push(m)
            while (!g.identicalNodes(m,s)){
                m = prevMap.get(g.key(m));
                path.push(m)

            }
            
            return path.reverse();
            //Return the list of nodes that the procedure has traversed to reach n.
            //End If       
        }
//         Add the unvisited neighbors of n to Q, mark them as visited and mark n as the node they came from.
//         End While
        for (const m of g.neighbors(n)) {
            if (!visitedSet.has(g.key(m))) {
                q.enqueue(m);
                visitedSet.add(g.key(m));
                prevMap.set(g.key(m),n);
            }
        }
        }    
//     Return the shortest-path tree rooted at node s.
// End procedure
    return path;
}  

