from Database_conductor import *
dir_path = './'

import re
import os
def remove_control_characters(html):
    def str_to_int(s, default, base=10):
        if int(s, base) < 0x10000:
            return chr(int(s, base))
        return default
    html = re.sub(u"&#(\d+);?", lambda c: str_to_int(c.group(1), c.group(0)), html)
    html = re.sub(u"&#[xX]([0-9a-fA-F]+);?", lambda c: str_to_int(c.group(1), c.group(0), base=16), html)
    html = re.sub(u"[\x00-\x08\x0b\x0e-\x1f\x7f]", "", html)
    return html

def convert(team_name, channels_list, graph='mention_based_graph_info', user='read_database', pwd='FluoBySusTech',
            port=3306, host='10.20.13.209', dbname='rowdata'):
    if os.path.isfile(dir_path + "/mention_based/{}_{}.gexf".format(team_name, channels_list[0])):
        return

    from gexf import Gexf
    from textblob import TextBlob
    import random
    import pymysql
    import pandas as pd
    import networkx as nx

    database_conductor = Database_conductor(True)

    gexf_dict = dict()

    try:
        con = pymysql.Connect(host=host, port=port, user=user, passwd=pwd, db=dbname)
        cur = con.cursor()
    except pymysql.Error as e:
        print("Error %d: %s" % (e.args[0], e.args[1]))

    cur.execute('select id,name from people')
    people_id = cur.fetchall()
    people_id = dict(people_id)

    cur.execute('select * from team_channel_relation ')
    team_to_channel = cur.fetchall()
    team_to_channel = list(map(list, zip(*team_to_channel)))
    team = team_to_channel[0][:]
    channel = team_to_channel[1][:]
    team_to_channel = {'team': team, 'channel': channel}
    team_to_channel = pd.DataFrame(team_to_channel)

    for channel_file in channels_list:

        gexf = Gexf("Gephi.org", "A Web network")
        output = gexf.addGraph("directed", "static", "A Web network")
        cur.execute('select * from people_channel_relation where channel_id = \'' + channel_file + '\' ')
        person_and_channel = cur.fetchall()

        if len(person_and_channel) == 0:
            print('1')
            gexf_dict[channel_file] = gexf

        else:

            person_and_channel = list(map(list, zip(*person_and_channel)))
            person = person_and_channel[0][:]
            channel = person_and_channel[1][:]
            person_and_channel = {'person': person, 'channel': channel}
            person_and_channel = pd.DataFrame(person_and_channel)
            del person
            del channel

            person_list = person_and_channel['person']

            # print(person_and_channel)

            channel_node = output.addNodeAttribute(force_id="Channel", title="channel", type="String")
            team_node = output.addNodeAttribute(force_id="Team", title="team", type="String")
            weight_node = output.addNodeAttribute(force_id="weight", title="weight", type="float")
            person_set = set(person_list)
            person_to_channel = []
            for tem_person in person_set:
                cur.execute('select * from people_channel_relation where people_id = \'' + tem_person + '\' ')

                person_to_channel = person_to_channel + list(cur.fetchall())

            person_to_channel = list(map(list, zip(*person_to_channel)))
            person = person_to_channel[0][:]
            channel = person_to_channel[1][:]
            person_to_channel = {'person': person, 'channel': channel}
            person_to_channel = pd.DataFrame(person_to_channel)

            # print(person_to_channel)

            cc = 0
            num2333 = len(person_set)
            for tem_id in person_set:
                print(cc / num2333)
                try:
                    tem_name = people_id[tem_id]
                except KeyError:
                    tem_name = "Null"

                tem_channel_list = set(person_to_channel[person_to_channel['person'] == tem_id]['channel'])

                tmp_node = output.addNode(tem_id, tem_name)

                # calculdate node_weight
                node_weight = database_conductor.get_person_weight(tem_id)

                tmp_node.addAttribute(weight_node, str(node_weight))
                tem_team_list = set()
                for tem_channel in tem_channel_list:
                    # cur.execute('select team_id from team_channel_relation where channel_id = \'' + tem_channel + '\'')
                    # tem_team_list = cur.fetchall()
                    tem_team_list = tem_team_list | set(
                        team_to_channel[team_to_channel['channel'] == tem_channel]['team'])
                for tem_team in tem_team_list:
                    tmp_node.addAttribute(team_node, tem_team)

                for tem_channel in tem_channel_list:
                    tmp_node.addAttribute(channel_node, tem_channel)

                cc = cc + 1

            m = 'mention_based_graph_info'
            cur.execute('select * from ' + m + ' where channel_id = \'' + channel_file + '\' ')
            data = cur.fetchall()

            msg_att = output.addEdgeAttribute(force_id="Message", title="message", type='String', defaultValue='None')
            weight_att = output.addEdgeAttribute(force_id="Weight", title="weight", type='float', defaultValue='0')
            date_att = output.addEdgeAttribute(force_id="Date", title="date", type='float', defaultValue='None')
            channel_att = output.addEdgeAttribute(force_id="Channel", title="channel", type='String',
                                                  defaultValue='None')
            team_att = output.addEdgeAttribute(force_id="Team", title="team", type='String', defaultValue='None')
            cc = 0
            numhehe = len(data)
            for tem_m in data:
                print(cc / numhehe)
                sender, receiver, text, channel_id, team_id, ts = tem_m
                blob = TextBlob(text)
                text = remove_control_characters(text)
                weight = str(blob.sentiment.polarity)
                try:
                    tem_edge = output.addEdge(sender + receiver + str(cc), sender, receiver, weight=weight)
                    cc = cc + 1
                    tem_edge.addAttribute(msg_att, text)
                    tem_edge.addAttribute(weight_att, weight)
                    tem_edge.addAttribute(date_att, str(ts))
                    tem_edge.addAttribute(team_att, team_id)
                    tem_edge.addAttribute(channel_att, channel_id)
                except Exception:
                    receiver = re.findall('\<\@(.*?)\>', text)[0]
                    try:
                        tem_edge = output.addEdge(sender + receiver + str(cc), sender, receiver, weight=weight)
                        cc = cc + 1

                        tem_edge.addAttribute(msg_att, text)
                        tem_edge.addAttribute(weight_att, weight)
                        tem_edge.addAttribute(date_att, str(ts))
                        tem_edge.addAttribute(team_att, team_id)
                        tem_edge.addAttribute(channel_att, channel_id)
                    except Exception:
                        pass

            # print(channel_file)
            print (team_name, channel_file)
            try:
                output_file = open(dir_path + "/mention_based/{}_{}.gexf".format(team_name, channel_file), 'wb')
                # output_file=remove_control_characters(output_file)
                gexf.write(output_file)
            except Exception:
                print("Error at writing output_file")


            # print(gexf)
            # gexf_dict[channel_file]=gexf
            # print('2')
    try:
        output_file.close()
    except Exception:
        print("Error at diong out put_file.close()")

    return gexf_dict



database_conductor = Database_conductor(True)
from pprint import pprint
all_team_number = len(database_conductor.get_teams())
for index, team in enumerate(database_conductor.get_teams()):
    team_id = team[0]
    print('{}/{} {}'.format(index + 1, all_team_number, team[1]))
    all_channel_number = len(database_conductor.get_channels_from_team(team_id))
    for cnt, (_, channel) in enumerate((database_conductor.get_channels_from_team(team_id))):
        channel, channel_name = (database_conductor.get_channel_detail(channel)[0])
        print('\t{}/{} {}'.format(cnt + 1, all_channel_number, channel_name))
        convert(team_id, [channel])



# T024FJS4U C2H9SBGD7