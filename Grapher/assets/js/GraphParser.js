//merge函数，参数为一个数组：元素是一个channel的gexf；
//          return这些channel组成的对象
//draw: 参数为xml对象，画出相应的图表
//createGraph: 参数为一个xml对象，利用该xml内的node和edge创建一个graph对象，返回该对象
//filter:  参数为xml文件和要筛选的条件，根据条件返回筛选后的xml
//changeDigram: 无参数，调用filter，作图
//对象：
//graph:包含的node和edge的数组  （改为键名为id的map，键为对象的map？）
//node
//edge

//根据新数据更改creatgraph
"use strict"
var t = true;
var xmlfile;
var s = "http://www.gephi.org/gexf/1.2draft";
var dom = document.getElementById("main");
var myChart = echarts.init(dom);

var current_graph = {};
var max_node_weight = 0;
var max_edge_weight = 1;
var last_node_number = undefined;
var last_edge_number = undefined;
var first_edge_number = undefined;
var first_node_number = undefined;
// var the_xml

myChart.on('click', function (param) {
    var type = param['data'].type;
    if (type === 'node') {
        var id = param['data'].id;
        get_person(id);
        open_sidebar('sidebar-vertex', 'sidebar-edge');
        $('#sidebar-vertex').pxSidebar('update');
    } else {
        var source = param['data'].source;
        var target = param['data'].target;
        get_edge(source, target);
        open_sidebar('sidebar-edge', 'sidebar-vertex')
        $('#sidebar-edge').pxSidebar('update');
    }
})

function clear_draw_area() {

    myChart.clear();
    $('#easy-pie-chart-1').attr('data-max-value', 0).data('easy-pie-chart').update(0);
    $('#easy-pie-chart-2').attr('data-max-value', 0).data('easy-pie-chart').update(0);
    last_edge_number = undefined
    last_node_number = undefined
    $('.panel.box').attr('class', 'panel box invisible')

    $("#bs-slider-node").slider('disable');
    $("#bs-slider-edge").slider('disable');

    open_sidebar('', 'sidebar-vertex')
    open_sidebar('', 'sidebar-edge')

}

function draws(team, channels) {
    var channel_xmls = [];
    // console.log(team);
    console.log('channels', channels);
    if (channels.length === 0) {
        clear_draw_area()
        return
    }
    myChart.showLoading();
    // enable
    $("#bs-slider-node").slider('enable');
    $("#bs-slider-edge").slider('enable');

    for (var index = 0; index < channels.length; index++) {
        var channel = channels[index][0];
        if ((jQuery.inArray(channel, Object.keys(loaded_channels))) === -1) {
            get_graph_xml(team, channel, function (ret) {
                loaded_channels[channel] = ret;
                channel_xmls.push(loaded_channels[channel]);
                if (channel_xmls.length === channels.length) {
                    xmlfile = channel_xmls[0].implementation.createDocument(channel_xmls[0].namespaceURI, null, null);
                    var newNode = xmlfile.importNode(channel_xmls[0].documentElement, true);
                    xmlfile.appendChild(newNode);
                    current_graph = merge(channel_xmls, channels)
                    first_edge_number = undefined;
                    draw(current_graph, conditions, channels);
                }
            });
        } else {
            channel_xmls.push(loaded_channels[channel]);
            if (channel_xmls.length === channels.length) {
                xmlfile = channel_xmls[0].implementation.createDocument(channel_xmls[0].namespaceURI, null, null);
                var newNode = xmlfile.importNode(channel_xmls[0].documentElement, true);
                xmlfile.appendChild(newNode);
                current_graph = merge(channel_xmls, channels)
                first_edge_number = undefined;
                draw(current_graph, conditions, channels);
            }
        }
    }
}

function merge(channelxml_Array, channels) {
    console.log('this is it ', channels)
    var graph = new Graph();
    for (var i = 0; i < channelxml_Array.length; i++) {
        // console.log(channelxml_Array[i])
        console.log("channelarray in merge",channelxml_Array[i])
        var channelGraph = createGraph(channelxml_Array[i], channels[i][1]);

        graph.addGraph(channelGraph);
    }

    return graph;
}

function draw(current_graph, conditions, channels) {
    conditions = conditions || '';
    channels = channels || None;
    console.log('current_graph', current_graph)
    var on_draw_graph = filter(current_graph, conditions)
    var xml = on_draw_graph.xml;
    var node_number = on_draw_graph.node_number;
    var edge_number = on_draw_graph.edge_number;
    console.log('on_draw', xml);
    if (first_edge_number === undefined){
        var tmp_complete_graph = filter(current_graph, '')
        first_edge_number = tmp_complete_graph.edge_number;
        first_node_number = tmp_complete_graph.node_number;
        $('#easy-pie-chart-1').attr('data-max-value', first_node_number).data('easy-pie-chart').update(0);
        // $('#easy-pie-chart-1').attr('data-max-value', first_node_number).data('easy-pie-chart').update(100);
        $('#easy-pie-chart-2').attr('data-max-value', first_edge_number).data('easy-pie-chart').update(0);
        // $('#easy-pie-chart-2').attr('data-max-value', first_edge_number).data('easy-pie-chart').update(100);
    }
    if (node_number === last_node_number && edge_number === last_edge_number)
        return
    else
        last_edge_number = edge_number
    last_node_number = node_number
    console.log('edge_number', edge_number, last_node_number / first_node_number * 100)
    console.log('node_number', node_number, last_edge_number / first_edge_number * 100)
    $('#easy-pie-chart-1').data('easy-pie-chart').update(last_node_number / first_node_number * 100);
    $('#easy-pie-chart-2').data('easy-pie-chart').update(last_edge_number / first_edge_number * 100);

    var dom = document.getElementById("main");
    // myChart = echarts.init(dom);
    var app = {};
    var option = null;
    app.title = 'FLUO';

    var graph = echarts.dataTool.gexf.parse(xml);
    var categories = [];
    for (var i = 0; i < channels.length; i++) {
        categories[i] = {
            name: channels[i][1]
        };
    }
    console.log('categories', categories)
    graph.nodes.forEach(function (node) {

        node.itemStyle = null;
        node.symbolSize = 10;
        // node.value = 'Channel X';
        node.category = node.attributes.Channel;
        // Use random x, y
        node.x = node.y = null;
        node.draggable = true;
        node.type = 'node';
        // console.log(node, node.channel)
        if (node.name != 'slackbot' && node.attributes.weight > max_node_weight) {
            max_node_weight = node.attributes.weight
            // console.log('updated', max_node_weight)
            // console.log(node)
        }
    });

    graph.links.forEach(function (edge) {
        edge.type = 'edge';
        // edge.name = '233'
        // console.log(edge)
    });
    option = {
        title: {
            text: '',
            subtext: '',
            top: 'bottom',
            left: 'right'
        },
        tooltip: {},
        legend: [{
            // selectedMode: 'single',
            data: categories.map(function (a) {
                return a.name;
            })
        }],
        animation: false,
        series: [
            {
                name: '',
                type: 'graph',
                layout: 'force',
                nodes: graph.nodes,
                links: graph.links,
                categories: categories,
                roam: true,
                label: {
                    normal: {
                        position: 'right',

                    }
                },
                force: {
                    repulsion: 100
                }
            }
        ]
    };

    myChart.setOption(option);
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
    myChart.hideLoading();


    $("#bs-slider-edge").slider({min: -1, max: parseFloat(max_edge_weight), range: [-1, parseFloat(max_edge_weight)]})
    // $("#bs-slider-edge").slider('setValue', [-1, parseInt(max_edge_weight)])
    $("#bs-slider-edge-div .pull-xs-right").html(max_edge_weight)
    $("#bs-slider-node").slider({min: 0, max: parseFloat(max_node_weight), range: [0, parseFloat(max_node_weight)],})
    // $("#bs-slider-node").slider('setValue', [-1, parseInt(max_node_weight)])
    $("#bs-slider-node-div .pull-xs-right").html(max_node_weight)
    $('.panel.box').attr('class', 'panel box')
}

function changeidNumber(id, number) {
    $(id).text(number);
}

// node_filter = {
//     'weight': "0.1-0.5",
//     "people_filter": ['Boris', "Liuliangxi"],
//     "people_filter_in": true,
//     "channel": [],
// }
//filter为一个function，传入一个xml对象以及要筛选条件，返回一个筛选后的xml对象


function createGraph(xmlFile, channel_name) {
    //console.log(xmlFile)
    var nodes = xmlFile.getElementsByTagName('node');
    var links = xmlFile.getElementsByTagName('edge');
    var graph = new Graph();

    for (var i = 0; i < nodes.length; i++) {
        //    console.log(nodes)
        var channel = new Array();
        var attvalues = nodes[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            for (var j = 2; j < attvalues.length; j++) channel.push(attvalues[j].getAttribute("value"));
            var node = new Node(nodes[i].getAttribute("id"),   //Node(id, label, team, weight, channel)
                nodes[i].getAttribute("label"),
                attvalues[1].getAttribute("value"),
                parseFloat(attvalues[0].getAttribute("value")),
                channel_name);
            graph.addNode(node);
            // if (node.weight > max_node_weight)
            //     max_node_weight = node.weight
            // console.log(node.weight)
            //graph.nodesid[i] = node.id;
        }

    }
    for (i = 0; i < links.length; i++) {//Edge(id, source, target, weight, channel, date, message)
        var attvalues = links[i].getElementsByTagName("attvalue");
        if (attvalues.length != 0) {
            var edge = new Link(links[i].getAttribute("id"),
                links[i].getAttribute("source"),
                links[i].getAttribute("target"),
                links[i].getAttribute("weight"),
                attvalues[4].getAttribute("value"),
                attvalues[2].getAttribute("value"),
                attvalues[0].getAttribute("value"),
                attvalues[3].getAttribute("value"));
            if (links[i].getAttribute("weight") > max_edge_weight) {
                max_edge_weight = links[i].getAttribute("weight");
            }
            graph.addLink(edge);
        }
    }
    return graph;
}

function filter(graph, conditions) {
    if(conditions === ''){
        conditions = {
            // "channel": ['C4YCQ57CG', 'C6WB33KNJ'],
            "nodeWeightUpLimit": "1000",
            "nodeWeightDownLimit": "0",
            "edgeWeightUpLimit": "1",
            "edgeWeightDownLimit": "-1",
            "keywords": [],
            "dateDownLimit": "0000000000000",
            "dateUpLimit": "9999999999999",
            "ifconclude": "0"
        }
    }
    //为了把filter写到一个函数里，要筛选的条件集成到一个（ ）的对象里；
    //从map对象里获取要筛选的条件
    // console.log("rawGraph in filter",graph);
    var channelChoose = conditions.channel;
    var nodeWeightUpLimit = parseFloat(conditions.nodeWeightUpLimit);
    var nodeWeightDownLimit = parseFloat(conditions.nodeWeightDownLimit);
    var edgeWeightUpLimit = parseFloat(conditions.edgeWeightUpLimit);
    var edgeWeightDownLimit = parseFloat(conditions.edgeWeightDownLimit);
    var keywords = conditions.keywords;
    var ifconclude = new Boolean();//是否包含
    ifconclude = conditions.ifconclude;
    var dateDownLimit = conditions.dateDownLimit;
    var dateUpLimit = conditions.dateUpLimit;
    var newgraph = new Graph;
    //读取
    var selectNodesid = [];

    //console.log(time.toLocaleTimeString());
    //对node进行筛选

    for (var nodekey in graph.getNodes()) {
        var node = graph.getNodes()[nodekey];
        var weight = parseFloat(node.weight);
        console.log('before build node')
        // console.log(nodekey, weight, t)
        if ((weight >= nodeWeightDownLimit) && (weight <= nodeWeightUpLimit)) {
            selectNodesid.push(node.id);
        }

    }

    //对edge进行筛选
    for (var linkkey in graph.getLinks()) {
        var link = graph.getLinks()[linkkey];
        var t = new Boolean();//是否包含关键字，t为true时包含
        t = false;
        var index2 = $.inArray(link.getsource(), selectNodesid);
        var index3 = $.inArray(link.gettarget(), selectNodesid);
        var date = link.getdate();
        //在不在所属channel
        if ((index2 != -1) && (index3 != -1)) {                                        //源点和目标点是否囊括所筛节点
            var weight = parseFloat(link.getweight());
            // console.log('second', weight)
            if ((weight <= edgeWeightUpLimit) && (weight >= edgeWeightDownLimit)) {  //weight范围是否合理
                if ((date <= dateUpLimit) && (date >= dateDownLimit)){

                    if (keywords.length != 0) {
                        for (var j = 0; j < keywords.length; j++) {
                            if (link.getmessage().indexOf(keywords[j]) != -1) {           //是否包含关键字
                                t = true;
                                break
                            }
                        }
                    }
                    if (((keywords.length == 0) || (ifconclude == false && t == false) || (ifconclude == true && t == true)) && (link.getsource() != link.gettarget())) {
                        if (newgraph.getNodes()[link.gettarget()] == null) newgraph.addNode(graph.getNode(link.gettarget()));
                        if (newgraph.getNodes()[link.getsource()] == null) newgraph.addNode(graph.getNode(link.getsource()));
                        newgraph.addLink(link);//可去掉单独的点
                        //}
                    }
                }
                //}
            }
        }
    }
    newgraph.mergelinks();

    //console.log("newgraph in filter",newgraph);

    //替换
    //node
    //edge

    //删除node
    var newNodes = xmlfile.createElement("nodes");
    var y = xmlfile.getElementsByTagName("nodes")[0];

    for (var node in newgraph.getNodes()) {
        newNodes.appendChild(graph.makeNode(newgraph.getNodes()[node]));
    }
    y.parentNode.removeChild(y);
    xmlfile.getElementsByTagName("graph")[0].appendChild(newNodes);

    var newEdges = xmlfile.createElement("edges");
    y = xmlfile.getElementsByTagName("edges")[0];
    for (var link in newgraph.getMergedLinks()) {

        var new_edge = graph.makemergedEdge(newgraph.getMergedLinks()[link])
        // console.log(new_edge.getAttribute('weight'))
        // if (new_edge.getAttribute('weight') >= conditions.edgeWeightDownLimit && new_edge.getAttribute('weight') <= new_edge.getAttribute('weight'))
        newEdges.appendChild(new_edge);

    }
    y.parentNode.removeChild(y)
    xmlfile.getElementsByTagName("graph")[0].appendChild(newEdges);
    // console.log("newgraph",newgraph);
    return {
        xml: xmlfile,
        node_number: newgraph.nodeslength(),
        edge_number: newgraph.mergedLinkslength()
    }
}


Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) return i;
    }
    return -1;
}
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
}

function Graph() {
    this.links = new Object();
    this.nodes = new Object();
    this.mergedLinks = new Object();

//this.nodesid = [];
}

Graph.prototype.getNodes = function () {
    return this.nodes;
}
Graph.prototype.getLinks = function () {
    return this.links;
}
Graph.prototype.getMergedLinks = function(){
    return this.mergedLinks;
}
Graph.prototype.addLink = function (newLink) {
    this.links[newLink.getid()] = newLink;
}
Graph.prototype.addNode = function (newNode) {
    this.nodes[newNode.getid()] = newNode;
    // console.log('on building first graph', newNode)
}
Graph.prototype.getNode = function (i) {
    return this.nodes[i];
}

Graph.prototype.getLink = function (i) {
    return this.links[i];
}
Graph.prototype.getMergedLink = function (i) {
    return this.mergedLinks[i];
}
Graph.prototype.linkslength = function () {
    return length(this.links);
}
Graph.prototype.nodeslength = function () {
    return length(this.nodes);
}
Graph.prototype.mergedLinkslength = function () {
    return length(this.mergedLinks);
}
Graph.prototype.isnode = function (id) {
    return (!(this.nodes[id] == null));
}
Graph.prototype.getnodebyid = function (id) {
    return this.nodes[id];
}
Graph.prototype.addGraph = function (graph) {
    for (var nodekey in graph.getNodes()) {
        this.addNode(graph.getNodes()[nodekey]);
    }
    for (var linkkey in graph.getLinks()) {
        this.addLink(graph.getLinks()[linkkey])
    }
}
Graph.prototype.makeNode = function (graphnode) {
    // console.log('inside building nodes', graphnode)
    var newNode = xmlfile.createElement("node");
    newNode.setAttribute("id", graphnode.getid());
    newNode.setAttribute("label", graphnode.getlabel());
    newNode.setAttribute("xmlns", s);
    newNode.setAttribute("team", graphnode.getteam());
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphnode.getweight());
    attvalues.appendChild(attvalue);
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "Channel");
    attvalue.setAttribute("value", graphnode.channel);
    attvalues.appendChild(attvalue);
    newNode.appendChild(attvalues);
    //    var color = xmlfile.createElement("viz:color");
    //    color.setAttribute("r",0);
    // color.setAttribute("g",0);
    // color.setAttribute("b",255);
    //    newNode.appendChild(color);
    return newNode;
}
Graph.prototype.makemergedEdge = function (graphedge) {
    var newEdge = xmlfile.createElement("edge");
    newEdge.setAttribute("id", graphedge.getid());
    newEdge.setAttribute("xmlns", s);
    newEdge.setAttribute("team", graphedge.getteam());
    newEdge.setAttribute("source", graphedge.getsource());
    newEdge.setAttribute("target", graphedge.gettarget());
    newEdge.setAttribute("weight", graphedge.getweight()/graphedge.getcnt());
    var attvalues = xmlfile.createElement("attvalues");
    var attvalue = xmlfile.createElement("attvalue");
    attvalue.setAttribute("for", "weight");
    attvalue.setAttribute("value", graphedge.getweight());
    attvalues.appendChild(attvalue);
    newEdge.appendChild(attvalues);
    return newEdge;
}
Graph.prototype.mergelinks = function (){
    for(var linkkey in this.getLinks()){
        var key1 = this.getLinks()[linkkey].getsource()+this.getLinks()[linkkey].gettarget();
        var key2 = this.getLinks()[linkkey].gettarget()+this.getLinks()[linkkey].getsource();
        if ((this.mergedLinks[key1]==null)&&(this.mergedLinks[key2]==null)){
            var mergedlink = new mergeLink(key1,this.getLinks()[linkkey].getsource(),this.getLinks()[linkkey].gettarget(),
                this.getLinks()[linkkey].getweight(),this.getLinks()[linkkey].getchannel(),
                this.getLinks()[linkkey].getmessage(),this.getLinks()[linkkey].getteam());
            this.mergedLinks[key1]=mergedlink;
        }
        else{
            if (this.mergedLinks[key1]!=null) {this.mergedLinks[key1].cnt++;this.mergedLinks[key1].messages.push(this.getLinks()[linkkey].getmessage());}
            else{this.mergedLinks[key2].cnt++;this.mergedLinks[key2].messages.push(this.getLinks()[linkkey].getmessage());}
        }
    }

}

function Link(id, source, target, weight, channel, date, message, team) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    // console.log(this.weight)
    this.channel = channel;
    this.date = parseFloat(date.replace(".","").substring(0,13))
    this.message = message;
    this.team = team;


}

Link.prototype.getid = function () {
    return this.id;
}
Link.prototype.getsource = function () {
    return this.source;
}
Link.prototype.gettarget = function () {
    return this.target;
}
Link.prototype.getweight = function () {
    return this.weight;
}
Link.prototype.getchannel = function () {
    return this.channel;
}
Link.prototype.getdate = function () {
    return this.date;
}
Link.prototype.getmessage = function () {
    return this.message;
}
Link.prototype.getteam = function () {
    return this.team;
}

function mergeLink(id, source, target, weight, channel, message, team) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.weight = weight;
    // console.log(this.weight)
    this.channel = channel;
    this.messages = [];
    this.messages[0]=message;
    this.team = team;
    this.cnt=1;
}
mergeLink.prototype.getid = function () {
    return this.id;
}
mergeLink.prototype.getsource = function () {
    return this.source;
}
mergeLink.prototype.gettarget = function () {
    return this.target;
}
mergeLink.prototype.getweight = function () {
    return this.weight;
}
mergeLink.prototype.getchannel = function () {
    return this.channel;
}
mergeLink.prototype.getmessages = function () {
    return this.messages;
}
mergeLink.prototype.getteam = function () {
    return this.team;
}
mergeLink.prototype.getcnt = function(){
    return this.cnt;
}



function Node(id, label, team, weight, channel) {
    this.id = id;
    this.label = label;
    this.team = team;
    this.weight = weight;
    this.channel = channel;
    // console.log('on building first node channel', channel)
}

Node.prototype.getid = function () {
    return this.id;
}
Node.prototype.getlabel = function () {
    return this.label;
}
Node.prototype.getweight = function () {
    return this.weight;
}
Node.prototype.getchannel = function () {
    return this.channel;
}
Node.prototype.getteam = function () {
    return this.team;
}

function loadXMLDoc(dname) {
    if (window.XMLHttpRequest) {
        var xhttp = new XMLHttpRequest();
    }
    else {
        var xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", dname, false);
    xhttp.send();
    return xhttp.responseXML;
}

function f(s) {
    var a = [];
    a.push(s.slice(0, 80));
    if (s.length > 80) a = a.concat(f(s.slice(80)));
    return a;
}

function length(obj) {
    var count = 0;
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            count++;
        }
        ;
    }
    ;
    return count;
}

function createXml(str) {
    if (document.all) {
        var xmlDom = new ActiveXObject("Microsoft.XMLDOM")
        xmlDom.loadXML(str)
        return xmlDom
    }
    else
        return new DOMParser().parseFromString(str, "text/xml")
}