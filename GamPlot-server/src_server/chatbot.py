import json
import uuid
import openai
import re
import time
from datetime import datetime
import tornado.gen
import os

openai.api_key = os.environ.get('OPENAI_API_KEY')
openai.api_base = os.environ.get('OPENAI_API_BASE')
openai.api_version = os.environ.get('OPENAI_API_VERSION')
openai.api_type = 'azure'
GPT35_MODEL_NAME = 'gpt-35-turbo-16k'
GPT4_MODEL_NAME = 'gpt-35-turbo-16k'
OPENAI_TRY_TIMES = 4


class ChatbotWrapper:
    """
    A wrapper for the chatbot. Given an experiment mode, it handles retrieving the next prompt from the pool of prompts,
    constructing the initial prompt to the OPEN_AI, Conversation log, and constructing the following prompts to the
    OPEN_AI

    ...

    Attributes
    ----------
    chistory: list<str>
        A list of triples that logs the full conversation: [tag, time, message]. Used for logging the experiment
    history: list<str>
        A list that contains message history. Used for constructing the prompts to OPEN_AI
    experiment_mode: int
        experiment_mode
    prompt_selector: PromptSelector
        instance of prompt_selector
    prompt_file: int
        prompt file name
    initial_prompt_data: prompt data retrieved from pre-generated jason files
    npc_name: str
    player_name: str
    function_token: str

    Methods
    -------
    get_initial_prompt:
        given the mode of experiment and the prompt data, constructs the initial prompt, requests to OPEN_AI,
        fixes formatting of the response, adds it to the chat history, and returns the first response to user.

    get_response:
        given a response from user, chat history, and mode of experiment, constructs the next prompt, requests to
        OPEN_AI, fixes formatting of the response, adds it to the chat history, and returns the response to user.
    """

    def __init__(self, game_summary="", game_story=""):
        self.gpt35_model_name = GPT35_MODEL_NAME
        self.gpt4_model_name = GPT4_MODEL_NAME
        self.openai_try_times = OPENAI_TRY_TIMES

        self.history = []
        self.ctlNPCs = []
        self.game_session_summary = ""
        self.prompt_file = 'sample'

        self.game_story = game_story
        self.game_summary = game_summary

        self.STOPWORDS = ["Player:", "Game:"]

    def update_summary(self, new_game_summary):
        self.game_summary = new_game_summary

    def get_initial_message(self):
        if self.game_story == "":
            self.initial_prompt_data = self.read_prompt_file()
        else:
            self.initial_prompt_data = self.game_story

        self.opening_story, self.instructions, game_1, player_1, game_2 = self.parse_game_story(self.initial_prompt_data)

        self.history = [game_1, player_1, game_2]

        player_prompt = "\n\n".join([self.opening_story, game_1, player_1, game_2])

        self.npcs = self.find_npc_inner_thoughts(player_prompt)

        filtered_text = self.remove_inner_thoughts(player_prompt)
        return player_prompt, self.npcs, filtered_text


    def getLatestNPCs(self):
        return self.npcs

    def update_ctlNPCs(self, ctlNPCs):
        self.ctlNPCs = ctlNPCs


    def find_npc_inner_thoughts(self, text, visible_tags=['action', 'words', 'id']):
        npcs = {}
        pattern = r'\[ID\] (.*?):\s*(.*?)(?=\n\[ID\]|\n[^\[]|$)'
        matches = re.findall(pattern, text, re.DOTALL)
        for item in matches:
            npc_id, thoughts = item[0].strip(), item[1].strip()
            npc_id = npc_id.strip()
            if not npc_id:
                continue

            inner_thoughts = thoughts.strip().split("\n")
            npc_data = []
            for line in inner_thoughts:
                tag = line[line.find("[")+1: line.find("]")].lower().strip()
                if tag in visible_tags:
                    continue
                key_end = line.find("]") + 1
                key = line[:key_end]
                value = line[key_end:]
                npc_data.append([key.strip(), value.strip()])
            npcs[npc_id] = npc_data

        return npcs




    def parse_game_story(self, story):
        lower_story = story.lower()
        instructions_index = lower_story.find("instructions:")
        first_game_index = lower_story.find("game:")
        second_game_index = lower_story.find("game:", first_game_index + 1)
        first_player_index = lower_story.find("player:")
        opening_story = story[lower_story.find("opening story:"): instructions_index].strip()
        instructions = story[instructions_index: first_game_index].strip()
        game_1 = story[first_game_index: first_player_index].strip()
        player_1 = story[first_player_index: second_game_index].strip()
        game_2 = story[second_game_index: lower_story.find("player:", first_player_index + 1)].strip()
        return opening_story, instructions, game_1, player_1, game_2



    def remove_inner_thoughts(self, text, allowed_tags=['action', 'words', 'id']):
        filtered = []
        for line in text.split("\n"):
            tag = line[line.find("["): line.find("]")+1]
            if tag != '' and line.strip().startswith(tag) and tag[1:-1].strip().lower() not in allowed_tags:
                continue
            filtered.append(line)
        return "\n".join(filtered)

    async def generate_player_chat_gpt(self, text, use_gpt4=False):

        chunk_size = 40000
        llm = use_gpt4 if use_gpt4 else self.gpt35_model_name
        system_message = self.opening_story + "\n\n" + self.instructions + "\n\n" + "Use the following situations to guide the game:\n\n" + self.game_summary
        messages = [{"role": "system", "content": system_message}]
        conversation_messages = "\n\n".join(self.history) + "\n\nPlayer:\n\n" + text.strip() + "\n\nGame:"

        if len(conversation_messages) > chunk_size:
            if self.game_session_summary == "":
                segments = self.segment_text(conversation_messages, chunk_size)
                instructions = "Give me a detailed summary of what happened in the story from the beginning."
                self.game_session_summary = await self.summarize_chunks(segments, system_message, instructions, llm=self.gpt35_model_name)
                conversation_messages = "\n\nsummary of what happened between last turn and the next one:\n\n" + self.game_session_summary + "\n\nGame:" + 'Game:'.join(self.history[-10:]) + "\n\nPlayer:\n\n" + text.strip() + "\n\nGame:"
                self.short_history_pointer = len(self.history) - 10
            else:
                conversation_messages = "\n\nsummary of what happened between last turn and the next one:\n\n" + self.game_session_summary + "\n\nGame:" + 'Game:'.join(
                    self.history[self.short_history_pointer:]) + "\n\nPlayer:\n\n" + text.strip() + "\n\nGame:"
                if len(conversation_messages) > chunk_size:
                    segments = self.segment_text(conversation_messages, chunk_size)
                    instructions = "Give me a detailed summary of what happened in the story from the beginning."
                    self.game_session_summary = await self.summarize_chunks(segments, system_message, instructions,
                                                                        llm=self.gpt35_model_name)
                    conversation_messages = "\n\nsummary of what happened between last turn and the next one:\n\n" + self.game_session_summary + "\n\nGame:" + 'Game:'.join(
                        self.history[-10:]) + "\n\nPlayer:\n\n" + text.strip() + "\n\nGame:"
                    self.short_history_pointer = len(self.history) - 10


        messages.append({"role": "user", "content": conversation_messages})
        stopwords = ["Player:"]
        print("waiting for openai")

        response = await self.request_open_ai(llm=llm, stopword=stopwords, messages=messages, i=0)

        if response == "rate_limit":
            # self.history = self.history[:-1]
            return "openAI rate limit: try again", {}, "openAI rate limit: try again", "", "error"
        if response == 'content_filter':
            # self.history = self.history[:-1]
            return "openAI content filter: change the story and try again", {}, "openAI rate limit: try again", "", "error"
        if response == "openAI_error":
            # self.history = self.history[:-1]
            return "unknown openAI error", {}, "openAI rate limit: try again", "", "error"
        print("openAI responded")

        response_text = response.choices[0].message.content.strip()
        self.history.append("Player:\n\n" + text.strip())
        split_index = len(response_text) - 1
        split_token = ""
        for npc_id in self.ctlNPCs:
            new_split_index = response_text.find(npc_id)
            if new_split_index != -1 and new_split_index < split_index:
                split_index = new_split_index
                split_token = npc_id

        suggestion = ""
        removed_inner_thoughts = ""
        if split_token != "":
            temp_res = response_text.split(split_token)
            response_text, suggestion = temp_res[0].strip(), split_token + "\n" + (split_token + "\n").join(temp_res[1:]).strip()
        else:
            self.history.append("Game:\n\n" + response_text)
            removed_inner_thoughts = self.remove_inner_thoughts(response_text)
        new_npcs = self.find_npc_inner_thoughts(response_text)
        for npc, value in new_npcs.items():
            self.npcs[npc] = value
        return response_text, new_npcs, removed_inner_thoughts, suggestion, ""


    def undo(self):
        self.game_session_summary = ""
        if len(self.history) > 3:
            self.history.pop(-1)
            self.history.pop(-1)


    def bot_history(self):
        return self.opening_story + '\n\n' + self.instructions + '\n\n'.join(self.history)
    def read_prompt_file(self):
        f = open('src_server/prompts/' + str(self.prompt_file) + '.txt', 'r')
        return ''.join(f.readlines())

    def infer_current_round(self, previous_text):
        current_round = 0
        for line in previous_text.split("\n"):
            line = line.strip()
            for i, stopword in enumerate(self.STOPWORDS):
                if line.startswith(stopword):
                    current_round = i
                    break
        return current_round

    async def generate_designer_chat_gpt(self, text, init_stopword=None, use_gpt4=False):
        chunk_size = 40000
        llm = self.gpt4_model_name if use_gpt4 else self.gpt35_model_name
        system_message = text.split("Game:")[0].strip()
        messages = [{"role": "system", "content": system_message}]
        conversation_messages = text[len(system_message):].strip()
        if len(conversation_messages) > chunk_size:
            segments = self.segment_text(conversation_messages, chunk_size)
            instructions = "Give me a detailed summary of what happened in the story from the beginning."
            conv_summary = await self.summarize_chunks(segments, system_message, instructions, llm=self.gpt35_model_name)
            conversation_messages = "\n\nsummary of what happened between last turn and the next one:\n\n" + conv_summary + "\n\nGame:" + 'Game:'.join(conversation_messages.split("Game:")[-10:])

        messages.append({"role": "user", "content": conversation_messages})
        current_round = self.infer_current_round(text)
        stopword = self.STOPWORDS[(current_round+1) % 2]
        response = await self.request_open_ai(llm=llm, stopword=stopword, messages=messages, i=0)
        if response == "rate_limit":
            return "openAI rate limit: try again"
        if response == 'content_filter':
            return "openAI content filter: change the story and try again"
        if response == "openAI_error":
            return "unknown openAI error"

        response_text = response.choices[0].message.content
        return response_text.strip() + "\n\n" + stopword

    async def summarize_chunks(self, segments, system_message, instructions, llm="gpt-35-turbo"):

        response_text = "\n"
        for segment in segments:
            # Create a new list of messages for each iteration
            if response_text.strip() != "":
                first_message = "<story>\n\n" + system_message + "\n\nsummary of what happened before:" + response_text + "\n\nWhat happened next:\n" + segment + "\n\n</story>\n\n" + instructions
            else:
                first_message = "<story>\n\n" + system_message + "\n\nWhat happened next:\n" + segment + "\n\n</story>\n\n" + instructions
            messages = [{"role": "user", "content": first_message}]
            response = await self.request_open_ai(llm=llm, stopword=["Player:", "Game:"], messages=messages, i=0, max_tokens=2000)
            if response == "rate_limit":
                return "openAI rate limit: try again"
            if response == 'content_filter':
                return "openAI content filter: change the story and try again"
            if response == "openAI_error":
                return "unknown openAI error"

            response_text = response.choices[0].message.content.strip()

        return response_text

    async def Generate_Game_plot(self, text, use_gpt4=False):
        llm = self.gpt4_model_name if use_gpt4 else self.gpt35_model_name
        system_message = text.split("Game:")[0]

        conversation_messages = text[len(system_message):]
        instructions = "\n\nSplit the story of what happened next into several stages and summarize each " \
                       "segment (labeled with <segment1>, <segment2>, etc) in such a way so that " \
                       "if the characters get into a similar situation, the game and the player will " \
                       "understand the summary and move the events in the same manner. The summarization " \
                       "of each segment should include [Previous Situation], [NPCs] that appeared in " \
                       "the plot segment, [Player's Actions] (including what they did and why they did so)" \
                       ", [NPCs' Actions] (including what they did and why they did so), and [Resulting Situation]."

        response_text = "\n"
        #with gpt-4 8k, 15000
        # with gpt-4-32k,
        # segments = self.segment_text(conversation_messages, max_tokens=23000)
        # 40000 16k models
        segments = self.segment_text(conversation_messages, max_tokens=40000)
        for segment in segments:
            # Create a new list of messages for each iteration
            if response_text.strip() != "":
                first_message = "<story>\n\n" + system_message + "summary of what happened before:" + response_text + "\n\nWhat happened next:\n" + segment + "\n\n</story>\n\n" + instructions
            else:
                first_message = "<story>\n\n" + system_message + "\n\nWhat happened next:\n" + segment + "\n\n</story>\n\n" + instructions
            messages = [{"role": "user", "content": first_message}]
            response = await self.request_open_ai(llm=llm, stopword=["Player:", "Game:"], messages=messages, i=0, max_tokens=2000)
            if response == "rate_limit":
                return "openAI rate limit: try again"
            if response == 'content_filter':
                return "openAI content filter: change the story and try again"
            if response == "openAI_error":
                return "unknown openAI error"

            response_text = response_text.strip() + "\n\n" + response.choices[0].message.content.strip()

        # merge segments
        if len(segments) > 1:
            new_message = "Here are a few segments describing the plot of a game:\n" + response_text + \
                          "\nTry to merge some of the segments to shorten the list of plot descriptions to 6 segments."
            messages = [{"role": "user", "content": new_message}]
            response = await self.request_open_ai(llm=llm, stopword=["Player:", "Game:"], messages=messages, i=0,
                                                  max_tokens=2000)
            response_text = response.choices[0].message.content

        new_npcs = self.find_npc_inner_thoughts(conversation_messages)
        if len(new_npcs) > 0:
            response_text = response_text.strip() + "\n\n NPCs:"

            for npc, attributes in new_npcs.items():
                response_text += f"\n\n[ID] {npc}"
                for i in range(2):
                    response_text += f"\n{attributes[i][0]} {attributes[i][1]}"
        return response_text.strip()


    async def Generate_Game_plot_V3(self, text, use_gpt4=False):
        llm = self.gpt4_model_name if use_gpt4 else self.gpt35_model_name

        conversation_messages = text
        instructions = "\n\nGiven the game plot from previous segments and this segment of the game story, Give me a detailed plot of the game that can be used for future when other players play this game." \
                       "Game plot must have the following sections: Title, Plot Summary, Key events in order.\ngenerate game plot grounded to the given story:"

        response_text = "\n"
        #with gpt-4 8k 23000, without it
        # segments = self.segment_text(conversation_messages, max_tokens=23000)
        # 40000, 16k models
        segments = self.segment_text(conversation_messages, max_tokens=40000)
        print(len(segments))
        for segment in segments:
            print("segment")
            # Create a new list of messages for each iteration
            messages = [{"role": "user", "content": "game plot from previous segments:\n" + response_text}]

            # Add the segment to messages
            messages.append({"role": "user", "content": segment})

            messages.append({"role": "user", "content": instructions})

            response = await self.request_open_ai(llm=llm, stopword=["Player:", "Game:"], messages=messages, i=0, max_tokens=2000)
            if response == "rate_limit":
                return "openAI rate limit: try again"
            if response == 'content_filter':
                return "openAI content filter: change the story and try again"
            if response == "openAI_error":
                return "unknown openAI error"

            response_text = response.choices[0].message.content

        new_npcs = self.find_npc_inner_thoughts(conversation_messages[len(conversation_messages.split("Game:")[0]):])
        if len(new_npcs) > 0:
            response_text = response_text.strip() + "\n\n NPCs:"
            for npc, attributes in new_npcs.items():
                response_text += f"\n\n[ID] {npc}"
                for i in range(2):
                    response_text += f"\n{attributes[i][0]} {attributes[i][1]}"
        return response_text


    def segment_text(self, text, max_tokens=23000):
        # Split the text into sentences
        turns = re.split(r'Player:', text, flags=re.IGNORECASE)

        # Initialize variables
        segments = []
        current_segment = turns[0]

        # Iterate through sentences and build segments
        for turn in turns[1:]:
            if len(current_segment) + len(turn) < max_tokens:
                current_segment += "Player:\n" + turn
            else:
                segments.append(current_segment)
                current_segment = "Player:\n" + turn

        # Append the last segment
        if current_segment:
            segments.append(current_segment)

        return segments
    async def request_open_ai(self, llm, stopword, messages, i, max_tokens=1000, timeout=30):
        try:
            loop = tornado.ioloop.IOLoop.current()
            response = await loop.run_in_executor(None, self.call_open_ai, llm, messages, stopword, i, max_tokens)

            if response.choices[0].finish_reason == 'content_filter':
                if i < self.openai_try_times:
                    response = await self.request_open_ai(llm=llm, stopword=stopword, messages=messages, i=i + 1, max_tokens=max_tokens, timeout=timeout)
                else:
                    return 'content_filter'

            return response

        except openai.error.RateLimitError:
            if i < self.openai_try_times:
                return await self.request_open_ai(llm=llm, stopword=stopword, messages=messages, i=i + 1, max_tokens=max_tokens, timeout=timeout)
            else:
                return "rate_limit"
        except tornado.gen.TimeoutError:
            return "timeout"
        except Exception as e:
            print("OPEN AI Server Error:\n" + str(e))
            return "openAI_error"

    def call_open_ai(self, llm, messages, stopword, i, max_tokens):
        print(messages)
        response = openai.ChatCompletion.create(
            engine=llm,
            messages=messages,
            stop=stopword,
            temperature=1,
            max_tokens=max_tokens,
            top_p=0.9,
        )
        return response