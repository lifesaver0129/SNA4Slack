console.log(GLOBAL_PATH)

var graph_inited = false;

var conditions = {
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

function init() {
    $.get("/teams", function (ret) {
        console.log(ret)
        // $('#channel_group').append('<optgroup label="' + 'retriving data, please wait....' + '">').trigger('change');
        for (var key in ret) {
            $("#team_list").append(
                '<option value="' + key + '">' + ret[key]["name"] + '</option>'
            );
        }
        console.log('finished');
    });

    $("#team_list").change(function () {
        var value = $("#team_list option:selected").val();
        var name = $("#team_list option:selected").text();
        get_channels(value, name);
        if ($('#collapseTwo').attr('class').indexOf("in") === -1) {
            $("#filter_button").click();
        }

    });

    function channel_change() {
        var channels = get_current_selected_channels()
        draws(current_team, channels);
    }

    $("#channel_group").on('select2:select', function (e) {
        channel_change();
    });

    $("#channel_group").on('select2:unselect', function (e) {
        channel_change();
    });

    // date filter
    $('#daterange-1').on('apply.daterangepicker', function (ev, picker) {
        //do something, like clearing an input
        var startDate = new Date((picker.startDate.format('YYYY-MM-DD')));
        var endDate = new Date(picker.endDate.format('YYYY-MM-DD'));
        conditions['dateDownLimit'] = startDate.getTime();
        conditions['dateUpLimit'] = endDate.getTime();
        console.log(startDate.getTime(), endDate.getTime())
        draw(current_graph, conditions, get_current_selected_channels())
    });

    $("#bs-slider-node").on('slide', function (num) {
        var lower_limit = num['value'][0] - 1
        var upper_limit = num['value'][1] + 1
        if (conditions['nodeWeightUpLimit'] === upper_limit && conditions['nodeWeightDownLimit'] === lower_limit)
            return
        conditions['nodeWeightUpLimit'] = upper_limit;
        conditions['nodeWeightDownLimit'] = lower_limit;
        draw(current_graph, conditions, get_current_selected_channels())
    })

    $("#bs-slider-edge").on('slide', function (num) {
        var lower_limit = num['value'][0]
        var upper_limit = num['value'][1]
        if (conditions['edgeWeightUpLimit'] === upper_limit && conditions['edgeWeightDownLimit'] === lower_limit)
            return
        conditions['edgeWeightUpLimit'] = upper_limit;
        conditions['edgeWeightDownLimit'] = lower_limit;
        draw(current_graph, conditions, get_current_selected_channels())
        console.log(conditions)
    })


    $("#main>div").append($("#piechart").html())
    $("#piechart").remove()
    var colors = pxDemo.getRandomColors();

    var config = {
        animate: 500,
        scaleColor: false,
        lineWidth: 4,
        lineCap: 'square',
        size: 90,
        trackColor: 'rgba(0, 0, 0, .09)',
        onStep: function (_from, _to, currentValue) {
            var value = $(this.el).attr('data-max-value') * currentValue / 100;

            $(this.el)
                .find('> span')
                .text(Math.round(value));
        },
    }


    $('#easy-pie-chart-1')
        .attr('data-percent', 100)
        .attr('data-max-value', 0)
        .easyPieChart($.extend({}, config, {barColor: colors[0]}));

    $('#easy-pie-chart-2')
        .attr('data-percent', 100)
        .attr('data-max-value', 0)
        .easyPieChart($.extend({}, config, {barColor: colors[1]}));

    // $('#easy-pie-chart-2').attr('class', )
    $('.panel.box').attr('class', 'panel box invisible')


}

function open_sidebar(open_id, close_id) {
    console.log('open', open_id, 'close', close_id)
    if (open_id === '') {
        if ($("#" + close_id).attr('class').indexOf('open') !== -1)
            $('#' + close_id).pxSidebar('toggle');
        return;
    }
    if ($("#" + open_id).attr('class').indexOf('open') !== -1) {
        return
    }
    if ($("#" + close_id).attr('class').indexOf('open') !== -1) {
        $('#' + close_id).pxSidebar('toggle');
        $('#' + close_id).pxSidebar('update');
    }
    $('#' + open_id).pxSidebar('toggle');
    $('#' + open_id).pxSidebar('update');
}


function standby(id) {
    document.getElementById(id).src = 'http://www.stallerdental.com/wp-content/uploads/2016/12/user-icon.png'
}

function get_current_selected_channels() {
    var channels = new Array()
    var data = $('#channel_group').find(":selected");
    console.log('data')
    console.log(data.length);
    for (var index = 0; index < data.length; index++) {
        console.log('put in channels', data[index].innerHTML)
        channels.push([data[index].value, data[index].innerHTML])
    }
    return channels
}

function init_graph() {
    // console.log($("#collapseThree-danger").attr('class').indexOf(("in")))
    if (graph_inited)
        return

    // -------------------------------------------------------------------------
    // Initialize donut chart
    graph_inited = true
    $(function () {
        var data = {
            columns: [
                ['data1', pxDemo.getRandomData()],
                ['data2', pxDemo.getRandomData()],
                ['data3', pxDemo.getRandomData()],
                ['data4', pxDemo.getRandomData()],
                ['data5', pxDemo.getRandomData()],
            ],
            type: 'donut',
        };

        c3.generate({
            bindto: '#c3-donut',
            color: {pattern: pxDemo.getRandomColors()},
            data: data,
            donut: {title: 'Some title'},
        });
    });

    // -------------------------------------------------------------------------
    // Initialize spline chart

    $(function () {
        var data = {
            type: 'spline',
            columns: [
                ['data1', pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData()],
                ['data2', pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData(), pxDemo.getRandomData()],
            ],
        };

        c3.generate({
            bindto: '#c3-spline',
            color: {pattern: pxDemo.getRandomColors()},
            data: data,
        });
    });


    init_word_cloud()
}

function init_word_cloud() {
    $("#vis").html("");
    w = $("#c3-donut").width();
    h = $("#c3-donut").height();
    svg = d3.select("#vis").append("svg").attr("width", w).attr("height", h);
    background = svg.append("g");
    vis = svg.append("g").attr("transform", "translate(" + [w >> 1, h >> 1] + ")");
}