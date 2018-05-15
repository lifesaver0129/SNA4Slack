console.log('123');


function get_channels(team_id, team_name, fn) {
    console.log('get channels inside')
    $('#channel_group').html("");
    $('#status_bar').html("retriving" + team_name);
    $('#status_bar_large').html("retriving" + team_name);
    $('#channel_group').select2({'placeholder': 'retriving data, please wait....'}).trigger('change');
    $('#channel_group').append('<optgroup label="' + 'retriving data, please wait....' + '">').trigger('change');
    $('#channel_group').append('</optgroup>').trigger('change');
    $.get('channels/' + team_id, function (dict) {
        $('#channel_group').html("");
        $('#channel_group').select2('close');
        $('#channel_group').val(null).trigger('change');
        $('#channel_group').append('<optgroup label="' + team_name + '">').trigger('change');
        var length = Object.keys(dict).length;
        if (length === 0) {
            $('#channel_group').select2({'placeholder': 'No channels found'})
            $('#channel_group').append('<option value="NULL" disabled>' + 'No channels found' + '</option>').trigger('change');
        } else {
            $('#channel_group').select2({'placeholder': 'Select channels'}).trigger('change');
            for (var key in dict) {
                var value = dict[key];
                $('#channel_group').append('<option value="' + key + '">' + value + '</option>').trigger('change');
            }
            ;
        }

        $('#channel_group').append('</optgroup>').trigger('change');
        console.log('refreshed', team_id)
        $('#status_bar').html(team_name);
        $('#status_bar_large').html('<i class="page-header-icon fa fa-users"></i>' + team_name);
        current_team = team_id;
        loaded_channels = {};
    })
}

function get_return(ret) {
    return ret;
}

function get_person(id) {
    $("#person_profile").attr('class', 'col-md-12 invisible')
    $(".loader").attr('class', 'loader visible')
    $.getJSON('/person/' + id, function (ret) {
        console.log(ret)
        var image = ret["img_192"];
        $("#person_profile .image").attr('src', image);
        $("#person_profile .name").html(ret["first_name"] + ' ' + ret["last_name"]);
        $("#person_profile .id").html('@' + ret["username"]);
        $("#person_profile .message_number strong").html(Object.keys(ret["messages"]).length);
        $("#person_profile .mention strong").html(ret['mention']);
        $("#person_profile .weight strong").html(new Intl.NumberFormat('en-US', {minimumFractionDigits: 3}).format(ret['weight']));

        var messge_list = "";
        console.log(ret['mentions'])
        for (var message in (ret['messages'])) {
            if (!ret['messages'][message]['channel_name'])
                continue
            messge_list += '<div class="widget-messages-alt-item ">'
            var channel = (ret['messages'][message]['channel_name']);
            var text = String(ret['messages'][message]['text']);
            var ts = (ret['messages'][message]['ts']);
            var date = new Date(ts * 1e3)
            var options = {
                year: '2-digit', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            };
            var americanDateTime = new Intl.DateTimeFormat('en-US', options).format;

            date = americanDateTime(date);

            messge_list += '<img src="' + image + '" id=\"' + ts + '\"' + '" onerror="standby(\'' + ts + '\')" class="widget-messages-alt-avatar"/>' +
                "<div>" + text + '</div>' +
                '<div class="widget-messages-alt-description">from <a href="#">' + channel + '</a></div>' +
                '<div class="widget-messages-alt-date">' + date + '</div>'
            messge_list += '</div>'
        }
        $("#person_profile .message_list").html(messge_list);
        $("#person_profile").attr('class', 'col-md-12')
        $('#sidebar-vertex').pxSidebar('update');
        $(".loader").attr('class', 'loader invisible')

    });
}

function get_edge(node1, node2) {
    $("#edge_profile").attr('class', 'col-md-12 invisible')
    $(".loader").attr('class', 'loader visible')
    $.getJSON('/edge/' + node1 + '/' + node2, function (ret) {
            console.log(ret)
            var node1_image = ret['node1']["img_192"];
            var node2_image = ret['node2']["img_192"];

            $("#edge_profile .node1_image").attr('src', node1_image);
            $("#edge_profile .node1_name").html(ret['node1']["first_name"] + ' ' + ret['node1']["last_name"]);
            $("#edge_profile .node1_id").html('@' + ret['node1']["username"]);

            $("#edge_profile .node2_image").attr('src', node2_image);
            $("#edge_profile .node2_name").html(ret['node2']["first_name"] + ' ' + ret['node2']["last_name"]);
            $("#edge_profile .node2_id").html('@' + ret['node2']["username"]);

            $("#edge_profile .message_number strong").html(Object.keys(ret["messages"]).length);
            // $("#edge_profile .weight strong").html(new Intl.NumberFormat('en-US', {minimumFractionDigits: 3}).format(ret['weight']));

            var messge_list = "";
            console.log(ret['mentions'])
            for (var index in (ret['messages'])) {
                if (!ret['messages'][index]['sender'])
                    continue
                if (String(ret['messages'][index]['sender']) === node1) {
                    messge_list += '<div class="widget-chat-item left">'
                    var image = node1_image
                    var pull = 'pull-right'
                    var user_name = ret['node1']["first_name"] //+ ' ' + ret['node1']["last_name"]
                }
                else {
                    messge_list += '<div class="widget-chat-item right">'
                    var image = node2_image
                    var pull = 'pull-right'
                    console.log('pull right')
                    var user_name = ret['node2']["first_name"]// + ' ' + ret['node2']["last_name"]
                }
                var channel = (ret['messages'][index]['channel_name']);
                console.log()
                var text = String(ret['messages'][index]['text']);
                var ts = (ret['messages'][index]['ts']);
                var date = new Date(ts * 1e3)
                var options = {
                    year: '2-digit', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                };
                var americanDateTime = new Intl.DateTimeFormat('en-US', options).format;

                date = americanDateTime(date);

                messge_list += '<img src="' + image + '" id=\"' + ts + '\"' + '" onerror="standby(\'' + ts + '\')" class="widget-chat-avatar"/>' +
                    '<div class="widget-chat-date ' + pull + '">' + date + '</div>' +
                    '<div class="widget-chat-heading"><a href="#" title="">' + user_name + '</a></div>' +
                    '<div class="widget-chat-text">' + text + '</div>'
                messge_list += '</div>'
            }
            $("#edge_profile .message_list").html(messge_list);
            $("#edge_profile").attr('class', 'col-md-12')
            $('#sidebar-edge').pxSidebar('update');
            $(".loader").attr('class', 'loader invisible')
        }
    )
    ;
}

function get_graph_xml(team, channel, fn) {
    console.log('getting graph xml', channel);
    $.ajax({
        type: 'GET',
        url: "graph/" + team + '/' + channel,
        dataType: 'xml',
        success: function (ret) {
            fn(ret)
        },
    })
}

function update_weight_bar(){

}