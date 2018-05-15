import pymysql
import hashlib
import re


class Database_conductor():
    def __init__(self, is_super_user):
        if is_super_user:
            pass
        self.database = 'rowdata'
        if is_super_user:
            self.connector = pymysql.connect(user='super_user',
                                             password='super_userOfFluo',
                                             host='10.20.13.209',
                                             database='rowdata',
                                             use_unicode=True,
                                             charset="utf8mb4"
                                             )
        self.cursor = self.connector.cursor()

    def store_channel(self, id, name):
        query = """
        INSERT INTO channels
        (`id`, `name`)
        VALUES 
        ("{}", "{}");
        """.format(id, name)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t[channel store error]:", e)
                print("\t", query)
            self.connector.rollback()

    def store_people(self, id, name, first_name, surname, deleted, image_192, image_original):
        name = name.replace("\\", "\\\\").replace('"', '\\\"').replace("\'", "\\'")
        first_name = first_name.replace("\\", "\\\\").replace('"', '\\\"').replace("\'", "\\'")
        surname = surname.replace("\\", "\\\\").replace('"', '\\\"').replace("\'", "\\'")
        if deleted:
            deleted = 1
        else:
            deleted = 0
        query = """
        INSERT INTO people
        (`id`, `name`, `first_name`, `surname`, `deleted`, `image_192`, `image_original`)
        VALUES 
        ("{}", "{}", "{}", "{}", "{}", "{}", "{}");
        """.format(id, name, first_name, surname, deleted, image_192, image_original)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t'[people store error]:", e)
                print("\t", query)
            self.connector.rollback()

    def store_people_channel_relation(self, people_id, channel_id):
        query = """
                INSERT INTO people_channel_relation
                (`people_id`, `channel_id`)
                VALUES 
                ("{}", "{}");
                """.format(people_id, channel_id)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t[people_channel_relation store error]:", e)
                print(query)
            self.connector.rollback()

    def store_team_channel_relation(self, team_id, channel_id):
        query = """
                        INSERT INTO team_channel_relation
                        (`team_id`, `channel_id`)
                        VALUES 
                        ("{}", "{}");
                        """.format(team_id, channel_id)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t[team_channel_relation store error]:", e)
                print("\t", query)
            self.connector.rollback()

    def store_teams(self, id, name, domain):
        query = """
                        INSERT INTO teams
                        (`id`, `name`, `domain`)
                        VALUES 
                        ("{}", "{}", "{}");
                        """.format(id, name, domain)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t[team store error]:", e)
                print("\t", query)
            self.connector.rollback()

    def store_message(self, user_id, channel_id, text, team_id, ts):
        text = text.replace("\\", "\\\\").replace('"', '\\\"').replace("\'", "\\'")
        query = """
                        INSERT INTO chat
                        (`user_id`, `channel_id`, `text`, `team_id`, `ts`)
                        VALUES 
                        ("{}", "{}", "{}", "{}", {});
                        """.format(user_id, channel_id, text, team_id, ts)

        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            # if not "Duplicate" in "{}".format(e):
            print("\t[message store error]:", e)
            print("\t", query)
            self.connector.rollback()

    def store_mention_based_graph(self, sender, receiver, text, team_id, channel_id, ts):
        text = text.replace("\\", "\\\\").replace('"', '\\\"').replace("\'", "\\'")
        query = """
                        INSERT INTO mention_based_graph_info
                        (`sender`, `receiver`, `text`, `team_id`, `channel_id`, `ts`)
                        VALUES 
                        ("{}", "{}", "{}", "{}", "{}", "{}");
                        """.format(sender, receiver, text, team_id, channel_id, ts)
        try:
            self.cursor.execute(query)
            self.connector.commit()
        except Exception as e:
            if not "Duplicate" in "{}".format(e):
                print("\t[mention_based_graph store error]:", e)
                print("\t", query)
            self.connector.rollback()

    def get_message(self):
        query = """
        SELECT * FROM chat
        """
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_channels_from_team(self, team_id):
        query = """
        SELECT * FROM team_channel_relation
        WHERE team_id = "{}"
        """.format(team_id)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_channel_detail(self, channel_id):
        query = """
                SELECT * FROM channels
                WHERE id = "{}"
                """.format(channel_id)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_teams(self):
        query = """
                SELECT * FROM teams
                """
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def close(self):
        self.cursor.close()
        self.connector.close()

    def get_person(self, id):
        query = """
        SELECT * FROM people
        WHERE id = "{}"
        """.format(id)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_person_messages(self, id):
        query = """
        SELECT * FROM chat
        WHERE user_id = "{}"
        """.format(id)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_mentioned(self, id):
        query = """
                SELECT * FROM mention_based_graph_info
                WHERE receiver = "{}"
                """.format(id)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_message_from_to(self, node1, node2):
        query = """
                        SELECT DISTINCT * FROM mention_based_graph_info
                        WHERE sender = "{}" and receiver = "{}"
                        """.format(node1, node2)
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_person_weight(self, person_id):
        query = """
                        select count(*) from (select distinct receiver from mention_based_graph_info where sender = '{}') a
                        """.format(person_id)
        self.cursor.execute(query)
        a = self.cursor.fetchall()[0][0]
        query = """
                        select count(*) from (select distinct receiver from mention_based_graph_info where receiver = '{}') a
                        """.format(person_id)
        self.cursor.execute(query)
        # print (self.cursor.fetchall[0])
        return a + self.cursor.fetchall()[0][0]

if __name__ == '__main__':
    database_conductor = Database_conductor(True)
    from pprint import pprint
    all_team_number = len(database_conductor.get_teams())
    for index, team in enumerate(database_conductor.get_teams()):
        team_id = team[0]
        print('{}/{} {}'.format(index + 1, all_team_number, team[1]))
        all_channel_number = len(database_conductor.get_channels_from_team(team_id))
        for cnt, (_, channel) in enumerate((database_conductor.get_channels_from_team(team_id))):

            channel, channel_name = (database_conductor.get_channel_detail(channel)[0])
            print('{}/{} {}'.format(cnt + 1, all_channel_number, channel_name))
            print(channel)
            quit()


