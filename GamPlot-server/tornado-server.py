import tornado.web
import tornado.websocket
import tornado.ioloop
import json
import uuid
import hashlib
import random
from src_server.chatbot import ChatbotWrapper
from tornado.options import define, options, parse_command_line

from datetime import datetime

import os
from datetime import datetime
import time
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient


clients = []

# blob_resource_endpoint = os.environ.get('AZURE_STORAGEBLOB_RESOURCEENDPOINT')
blob_connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')

localtunnel_http = "http://ui-test-gameplot-2005.loca.lt"
localtunnel_https = "https://ui-test-gameplot-2005.loca.lt"



class WebSocketHandler(tornado.websocket.WebSocketHandler):


    def initialize(self, rooms):
        self.rooms = rooms
        self.ws_id = f"{id(self)}_{int(time.time())}"
    """
        Inherits the tornado WebSocketHandler. Instantiates the chatbot, communicates between the chatbot and the user,
        saves the data when the socket is closed.
        """

    def open(self, room_number, username):
        print(len(self.rooms))
        print("new client")
        is_designer_str = self.get_argument('is_designer', default='false')
        # ws_id = self.get_argument('ws_id', default=None)
        # print(ws_id)
        # import pdb; pdb.set_trace()
        # self.ws_id = ws_id if ws_id and ws_id != 'null' else self.ws_id
        print(self.ws_id)
        self.is_designer = True if is_designer_str.lower() == 'true' else False

        self.room_number = room_number
        self.username = username

        if room_number not in self.rooms:
            self.write_message(json.dumps({'type': 'error', 'text': 'Room does not exist.'}))
            self.close()
            return

        if self.is_designer:
            self.rooms[self.room_number]['designer_handle'] = self
        self.rooms[room_number]['participants'].append(self)
        self.broadcast_message(f'{username} joined the room', f'{username} joined the room', message_type='user_joined', username=self.username, include_self=False)
        if len(self.rooms[self.room_number]['chat_history']) > 0:
            chat_history = self.rooms[self.room_number]['chat_history']
            if self.is_designer:
                chat_history = self.rooms[self.room_number]['designer_chat_history']

            self.write_message(json.dumps({
                'type': 'history',
                'text': chat_history,
                'npcs': self.rooms[self.room_number]['chatbot'].getLatestNPCs(),
                'game_summary': self.rooms[self.room_number]['game_summary'],
                'feedback_features': self.rooms[self.room_number]['feedback_features']
                # 'ws_id': self.ws_id
            }))

        else:
            initial_prompt, npcs, filtered_text = self.rooms[self.room_number]['chatbot'].get_initial_message()
            message_id = datetime.now().timestamp()
            self.rooms[self.room_number]['chat_history'].append({'text': filtered_text, 'username': 'NPC', 'message_id': message_id})
            self.rooms[self.room_number]['designer_chat_history'].append(
                {'text': initial_prompt, 'username': 'NPC', 'message_id': message_id})
            response = initial_prompt if self.is_designer else filtered_text
            # print(initial_prompt)
            # print(response)
            self.rooms[room_number]['feedbacks'] = {}
            self.write_message(json.dumps({
                'type': 'npc_chat',
                'text': response,
                'unfiltered_text': initial_prompt,
                'message_id': message_id,
                'npcs' : npcs,
                'username': "NPC",
                'game_summary': self.rooms[self.room_number]['game_summary'],
                'feedback_features': self.rooms[self.room_number]['feedback_features']
                # 'ws_id': self.ws_id
            }))

            # self.userID = str(uuid.uuid4())

    async def on_message(self, message):
        data = json.loads(message)
        text = data['text'].strip()
        # import pdb; pdb.set_trace()

        if data['type'] == 'chat':
            message_id = data['message_id']
            self.rooms[self.room_number]['chat_history'].append({'text': text, 'username': self.username, 'message_id': message_id})
            self.rooms[self.room_number]['designer_chat_history'].append(
                {'text': text, 'username': self.username, 'message_id': message_id})
            self.broadcast_message(message=text, designer_message=text, message_type='chat', username=self.username, include_self=False,
                                   message_id=message_id)
        elif data['type'] == 'ask_chatbot':
            message_id = data['message_id']
            self.rooms[self.room_number]['chat_history'].append(
                {'text': text, 'username': self.username, 'message_id': message_id})
            self.rooms[self.room_number]['designer_chat_history'].append(
                {'text': text, 'username': self.username, 'message_id': message_id})
            self.broadcast_message(message=text, designer_message=text, message_type='ask_chatbot', username=self.username, include_self=False, message_id=message_id)
            response, npcs, filtered_text, suggestion, type_ = await self.rooms[self.room_number]['chatbot'].generate_player_chat_gpt(data['text'])
            if type_ == "error":
                self.broadcast_message(message=filtered_text, designer_message=response, message_type='error', username="NPC",
                                       include_self=True, npcs=npcs)

            elif suggestion == "":
                message_id = datetime.now().timestamp()
                self.rooms[self.room_number]['chat_history'].append(
                    {'text': filtered_text, 'username': 'NPC', 'message_id': message_id})
                self.rooms[self.room_number]['designer_chat_history'].append(
                    {'text': response, 'username': 'NPC', 'message_id': message_id})
                self.broadcast_message(message=filtered_text, designer_message=response, message_type='npc_chat', username="NPC", include_self=True, npcs=npcs, message_id=message_id)

            elif suggestion != "":
                message_id = datetime.now().timestamp()
                self.rooms[self.room_number]['designer_chat_history'].append(
                    {'text': response, 'username': 'NPC', 'message_id': message_id})
                self.rooms[self.room_number]['designer_handle'].write_message(({'type': 'get_designer_input',
                                                                                'text': response,
                                                                                'suggestion': suggestion,
                                                                                   'username': "NPC",
                                                                                    'message_id': message_id}))
        elif data['type'] == 'feedback':
            if data['feedback']['message_id'] not in self.rooms[self.room_number]['feedbacks'].keys():
                self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']] = {}
            if self.ws_id not in self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']]:
                self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']][self.ws_id] = {}
            # self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']][self.ws_id][data['feedback']['type']] = data['feedback']
            if data['feedback']['type'] == 'reset':
                self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']].pop(self.ws_id, "no key found")
                self.write_message(json.dumps({
                    'type': 'feedback_ack',
                    'text': "Feedback removed"}))
            else:
                self.rooms[self.room_number]['feedbacks'][data['feedback']['message_id']][self.ws_id][data['feedback']['type']] = data['feedback']
                # self.write_message(json.dumps({
                #     'type': 'feedback_ack',
                #     'text': "Feedback recorded"}))

        elif self.is_designer:
            if data['type'] == 'send_designers_input':
                message_id = data['message_id']
                self.rooms[self.room_number]['designer_chat_history'].append(
                    {'text': text, 'username': self.username, 'message_id': message_id})
                npc_response = data['npc_previous_text'] + '\n\n' + text
                self.rooms[self.room_number]['chatbot'].history.append(npc_response)
                message_id = datetime.now().timestamp()
                filtered_npc_response = self.rooms[self.room_number]['chatbot'].remove_inner_thoughts(npc_response)
                npcs = self.rooms[self.room_number]['chatbot'].find_npc_inner_thoughts(npc_response)
                self.rooms[self.room_number]['chat_history'].append(
                    {'text': filtered_npc_response, 'username': 'NPC', 'message_id': message_id})
                self.rooms[self.room_number]['designer_chat_history'].append(
                    {'text': npc_response, 'username': 'NPC', 'message_id': message_id})
                self.broadcast_message(message=filtered_npc_response, designer_message=npc_response, message_type='npc_chat',
                                       username="NPC", include_self=True, npcs=npcs)

            if data['type'] == 'update_summary':

                self.rooms[self.room_number]['game_summary'] = text.strip()
                self.rooms[self.room_number]['chatbot'].update_summary(text.strip())
                self.write_message(json.dumps({
                    'type': 'update_summary',
                    'text': "Game summary is successfully updated"}))

            if data['type'] == 'update_ctlNPCs':
                self.rooms[self.room_number]['chatbot'].update_ctlNPCs(data['ctlNPCs'])

            if data['type'] == 'bot_history':
                bot_history = self.rooms[self.room_number]['chatbot'].bot_history()
                self.write_message(json.dumps({'text': bot_history,
                                               'type': 'bot_history',
                                               'username': 'NPC',
                                               'message_id': datetime.now().timestamp()}))

            if data['type'] == 'undo':
                message_id = data['message_id']
                self.rooms[self.room_number]['chatbot'].undo()
                self.rooms[self.room_number]['designer_chat_history'].append(
                    {'text': text, 'username': self.username, 'message_id': message_id})
                bot_history = self.rooms[self.room_number]['chatbot'].bot_history()
                # self.write_message(json.dumps({'text': bot_history,
                #                                'type': 'bot_history',
                #                                'username': 'NPC',
                #                                'message_id': datetime.now().timestamp()}))
                filtered_npc_response = self.rooms[self.room_number]['chatbot'].remove_inner_thoughts(bot_history)
                self.broadcast_message(message=filtered_npc_response, designer_message=bot_history,
                                       message_type='bot_history',
                                       username="NPC", include_self=True)

            if data['type'] == 'download_log':
                data = self.create_log_data()
                self.write_message(json.dumps({'text': data, 'type': 'download_log'}))

        else:
            self.write_message(json.dumps({'type': 'error', 'text': 'Only designers can perform this request.'}))




    # def send_chat_history(self, chat_history):
    #     for message in chat_history:
    #         self.write_message(message)

    def broadcast_message(self, message, designer_message, message_type, username, include_self=False, message_id=datetime.now().timestamp(), npcs=None):
        room = self.rooms[self.room_number]
        # if message_type == 'ask_chatbot' or message_type == 'npc_chat':
        #     self.rooms[self.room_number]['chat_history'].append({'text': message,
        #                                                          'username': username,
        #                                                          'message_id': message_id})

        if room:
            participants = self.rooms[self.room_number]['participants']
            for participant in participants:
                if not include_self and self == participant:
                    continue

                if participant == self.rooms[self.room_number]['designer_handle']:
                    participant.write_message(json.dumps({'text': designer_message,
                                                          'unfiltered_text': designer_message,
                                                          'type': message_type,
                                                          'username': username,
                                                          'message_id': message_id,
                                                          'npcs': npcs}))
                else:
                    participant.write_message(json.dumps({'text': message,
                                                          'unfiltered_text': designer_message,
                                                          'type': message_type,
                                                          'username': username,
                                                          'message_id': message_id,
                                                          'npcs': npcs}))





    def on_close(self):
        if self.room_number in self.rooms:
            if self.is_designer:
                self.rooms[self.room_number]['chatbot'].ctlNPCs = []
            self.rooms[self.room_number]['participants'].remove(self)

            self.broadcast_message(self.username + ' left the room.', designer_message=self.username + ' left the room.', message_type='user_left', username=self.username)
            if len(self.rooms[self.room_number]['participants']) == 0:
                data = self.create_log_data()
                self.log_data(data)
                # self.upload_log_to_blob_storage(data)
                self.rooms.pop(self.room_number)

        print("WebSocket closed")

    def create_log_data(self):
        data = {'designer_chat_history': self.rooms[self.room_number]['designer_chat_history'],
                'players_chat_history': self.rooms[self.room_number]['chat_history'],
                'chatbot_history': self.rooms[self.room_number]['chatbot'].bot_history(),
                'game_plot': self.rooms[self.room_number]['game_summary'],
                'game_story': self.rooms[self.room_number]['game_story'],
                'feedbacks': self.rooms[self.room_number]['feedbacks']}

        return data

    def log_data(self, data):
        with open(f'output/{self.room_number}_{datetime.now().timestamp()}.json', 'w') as json_file:
            json.dump(data, json_file, indent=4)

    def upload_log_to_blob_storage(self, data):
        container_name = "your-container-name"
        # blob_name = f"{self.rooms[self.room_number]['designer_handle'].username}_{self.room_number}_{datetime.now().timestamp()}.json"
        blob_name = f"{self.room_number}_{datetime.now().timestamp()}.json"
        blob_service_client = BlobServiceClient.from_connection_string(blob_connection_string)
        # blob_service_client = BlobServiceClient(account_url=blob_resource_endpoint)
        # blob_service_client = blob_service_client.get_container_client(container_name)
        # Define your container name
        container_name = "gpbs"

        # Create a ContainerClient
        blob_container_client = blob_service_client.get_container_client(container_name)

        # Serialize the data to JSON format
        data_json = json.dumps(data, indent=4)

        # Upload the data as a blob to the container
        blob_client = blob_container_client.get_blob_client(blob_name)
        blob_client.upload_blob(data_json, overwrite=True)




    def check_origin(self, origin):
        return True


class CreateRoomHandler(tornado.web.RequestHandler):
    def initialize(self, rooms):
        self.rooms = rooms

    def set_default_headers(self):

        super().set_default_headers()

        allowed_origins = [
            "http://localhost:3005",
            "http://localhost:3005",
            "https://gentle-sky-083c69c1e.3.azurestaticapps.net",
            "http://gentle-sky-083c69c1e.3.azurestaticapps.net",
            localtunnel_http,
            localtunnel_https

        ]
        origin = self.request.headers.get("Origin")
        print(origin)
        if origin in allowed_origins:
            self.set_header("Access-Control-Allow-Origin", origin)
        self.set_header("Access-Control-Allow-Methods", "POST, OPTIONS, PUT, GET")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def options(self):
        self.set_status(204)
        self.finish()

    def post(self):
        print("post")
        data = json.loads(self.request.body)
        room_number = data["room_number"]
        room_pass = data["room_pass"]

        if 'is_designer' in data and data['is_designer']:
            room_number, room_pass = self.setup_room(data['game_summary'], data['game_story'], data["feedback_features"])
            response_data = {"message": "OK", "data": json.dumps({"room_number": room_number,
                                                                  "room_pass": room_pass,
                                                                  "username": data['username']})}
        elif room_number == '' and room_pass == '':
            room_number, room_pass = self.setup_room("", "", data["feedback_features"])
            response_data ={"message": "OK", "data": json.dumps({"room_number": room_number,
                                                                 "room_pass": room_pass,
                                                                 "username": data['username']})}
        elif room_number == '' and room_pass != '':
            response_data = {"message": "Leave Room Pass empty or enter a valid Room Number.", "data": None}
        elif room_number not in self.rooms:
            response_data = {"message": "Room Number does not exist", "data": None}
        elif self.rooms[room_number]['room_pass'] != room_pass:
            response_data = {"message": "Room Pass is wrong", "data": None}
        else:
            response_data ={"message": "OK", "data": json.dumps({"room_number": room_number,
                                                                 "room_pass": room_pass,
                                                                 "username": data['username']})}

        self.set_header("Content-Type", "application/json")
        self.write(response_data)

    def setup_room(self, game_summary, game_story, feedback_features=""):
        room_pass = str(random.randint(1, 100000))
        room_number = str(random.randint(1, 100000))
        while room_number in self.rooms.keys():
            room_number = str(random.randint(1, 100000))
        self.rooms[room_number] = {"chat_history": [],
                                   "designer_chat_history" : [],
                                   "participants": [],
                                   "room_pass": room_pass,
                                   "game_story": game_story,
                                   "game_summary": game_summary,
                                   "feedback_features": feedback_features,
                                   "chatbot": ChatbotWrapper(game_summary, game_story)}
        return room_number, room_pass


class BotHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        super().set_default_headers()
        allowed_origins = [
            "http://localhost:3005",
            "http://localhost:3005",
            "https://gentle-sky-083c69c1e.3.azurestaticapps.net",
            "http://gentle-sky-083c69c1e.3.azurestaticapps.net",
            localtunnel_http,
            localtunnel_https
        ]
        origin = self.request.headers.get("Origin")
        print(origin)
        if origin in allowed_origins:
            self.set_header("Access-Control-Allow-Origin", origin)
        self.set_header("Access-Control-Allow-Origin", "*")

        self.set_header("Access-Control-Allow-Methods", "POST, OPTIONS, PUT, GET")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def options(self):
        self.set_status(204)
        self.finish()

    async def post(self):
        print("post")
        self.chatbot_wrapper = ChatbotWrapper()
        data = json.loads(self.request.body)
        if data['request'] == 'generate_response':
            text = data['text']
            response = await self.chatbot_wrapper.generate_designer_chat_gpt(text)
        elif data['request'] == 'summarize':
            text = data['text']
            if data['method'] == 1:
                response = await self.chatbot_wrapper.Generate_Game_plot_V3(text, use_gpt4=True)
            elif data['method'] == 2:
                response = await self.chatbot_wrapper.Generate_Game_plot(text, use_gpt4=True)

        response_data = {"message": "OK", "data": json.dumps({"response": response})}
        self.set_header("Content-Type", "application/json")
        self.write(response_data)


def make_app():
    rooms = {}
    return tornado.web.Application([

        (r"/create-room", CreateRoomHandler, dict(rooms=rooms)),
        (r"/websocket/([a-f0-9]+)/(.+)", WebSocketHandler, dict(rooms=rooms)),
        (r"/bot", BotHandler),

    ], websocket_ping_interval=30, websocket_ping_timeout=500)


app = make_app()

if __name__ == "__main__":
    define('port', default=8000, help='REST API Port', type=int)
    parse_command_line()
    app.listen(options.port, '0.0.0.0')
    print("NPC server is running at: http://0.0.0.0:" + str(options.port))
    tornado.ioloop.IOLoop.current().start()
