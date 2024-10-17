import React from 'react'
import '../index.css';
import './msgs.css'
import OutgoingMsgs from "./OutgoingMsgs";
import IncomingMsgs from "./IncomingMsgs";
import CollapseList from './CollapseList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { showInfoToast, showSuccessToast, showErrorToast } from './toastUtils';
import toast, { Toaster } from 'react-hot-toast';
import {faExclamationCircle} from "@fortawesome/free-solid-svg-icons";

import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBIcon,
  MDBBtn,
  MDBTypography,
  MDBTextArea,
  MDBCardHeader,
  MDBCollapse
} from "mdb-react-ui-kit";
import RoomInfo from "./RoomInfo";

// const SERVER = 'ws://localhost:8000';
const SERVER = process.env.REACT_APP_BACKEND_HOST_WS;
// const SERVER = 'wss://gameplot-server.azurewebsites.net';
// console.log(process.env.REACT_APP_BACKEND_HOST_HTTP)



// const SERVER = 'ws://localhost:5000/websocket';
const MANDATORY_NUM_TURNS = 20
class Mesgs extends React.Component{
    constructor(props) {
        super(props);
        this.displayData = [];
        this.summaryTextareaRef = React.createRef();
        // this.ws_id = null
        // this.userID = React.createRef();
        this.state = {
            initiate: true,
            showData: this.displayData,
            postVal:"",
            userID: "NONE",
            history: [],
            summaryPostVal: "",
            ctlNPCs: [],
            is_designer: this.props.is_designer,
            pos_features: [],
            neg_features: []
            // instructions: "",
        }
        this.appendData = this.appendData.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSummaryChange = this.handleSummaryChange.bind(this);
        this.appendResponse = this.appendResponse.bind(this);
        this.handleDownloadLog = this.handleDownloadLog.bind(this);
        // this.showSuccessToast = this.showSuccessToast.bind(this);
        // this.showInfoToast = this.showInfoToast.bind(this);
        this.appendHistory = this.appendHistory.bind(this);
      this.updateNPCs = this.updateNPCs.bind(this);
      this.handleUpdateSummary = this.handleUpdateSummary.bind(this);
      this.handleSwitchChange = this.handleSwitchChange.bind(this);
      this.download = this.download.bind(this);
      this.showInstructions = this.showInstructions.bind(this);
      // this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      // this.scrollMessageIntoView = this.scrollMessageIntoView.bind(this);


      this.collapseListRef = React.createRef();

    }

    //  loadInstructionsFromFile() {
    //   let instructions = "";
    //
    // }


    showInstructions(){
      const designer_instructions = "- To manage the appeared NPCs, simply toggle the control button (ctl).\n" +
        "- To revise the game plot and apply changes, edit the plot and click the update plot button.\n" +
        "- Additionally, you have access to these commands:\n" +
        "1. /chat: Communicate with players without interrupting the game flow.\n" +
        "2. /bot_history: Retrieve the game history.\n" +
        "3. /undo: Revert to the previous player's turn (avoid use during ctl mode).\n" +
        "- As a player, utilize the following tags when interacting with the bot: [Action], [Words]\n" +
        "- Example player turn:\n[Action] You swing open the door.\n[Words] Greetings!"
      const player_instructions = "- As a player, utilize the following tags when interacting with the bot: [Action], [Words]\n" +
        "- Example player turn:\n[Action] You swing open the door.\n[Words] Greetings!\n" +
        "- Additionally, you have access to these commands:\n" +
        "1. /chat: Communicate with other players and the game designer without interrupting the game flow.\n"
      let instructions = this.state.is_designer ? designer_instructions : player_instructions;
      if (this.state.is_designer) {
        this.appendResponse(instructions)
      }
    }
    componentDidMount() {
      this.configureserver()
      this.showInstructions()
      // if (this.props.is_designer) {
      //   window.addEventListener('beforeunload', this.handleBeforeUnload);
      // }
    }

    componentWillUnmount() {

    this.ws.close();
    //
    }

    appendHistory(data){
      // console.log(data)
      data.forEach((item, index) => {
        this.displayData.push(<IncomingMsgs key={item['message_id']} message_id={item['message_id']} text={item['text']} username={item['username']} pos_features={this.state.pos_features} neg_features={this.state.neg_features} ws={this.ws}/>)
      })
      this.setState({
            showdata : this.displayData,
            initiate: false,
            postVal: ""
        });
      document.getElementById("msg_h").scrollTop=document.getElementById("msg_h").scrollHeight;
    }

    appendResponse(data_text, data_username, message_id){
        this.displayData.push(<IncomingMsgs key={message_id} text={data_text} username={data_username} message_id={message_id} pos_features={this.state.pos_features} neg_features={this.state.neg_features} ws={this.ws}/>)
        this.setState({
            showdata : this.displayData,
            initiate: false,
            postVal: ""
        });
        document.getElementById("msg_h").scrollTop=document.getElementById("msg_h").scrollHeight;
        // this.scrollMessageIntoView(message_id);
    }

    updateNPCs(npcs){
      // console.log(npcs)
      this.collapseListRef.current.addItems(npcs);
    }
    configureserver = () => {
      // this.ws_id = localStorage.getItem('ws_id')
        // if (this.state.initiate) {
        //     this.setState({showdata : this.displayData,
        //         initiate: false,
        //         postVal: ""})
        //     console.log(this.state.is_designer)
        //     this.ws = new WebSocket(SERVER + '/websocket/' + this.props.room_number + '/' + this.props.username + '?is_designer=' + this.props.is_designer + '&ws_id=' + this.ws_id);
            this.ws = new WebSocket(SERVER + '/websocket/' + this.props.room_number + '/' + this.props.username + '?is_designer=' + this.props.is_designer);
            // console.log("its open")
            this.ws.onopen = () => {

              // this.userID.current.textContent = "Room Number: " + this.props.room_number + " Room Pass: " + this.props.room_pass
              // }
              this.ws.onmessage = (evt) => {
                let data = JSON.parse(evt.data)
                // console.log(data)
                if (data['type'] == 'user_left' || data['type'] == 'user_joined') {
                  showInfoToast(data['text'])
                  // }else if(data['type'] == 'admin_change') {
                  //   this.state.is_admin = true
                } else if (data['type'] == 'error') {
                  showErrorToast(data['text'])
                } else if (data['type'] == 'update_summary' || data['type'] == 'feedback_ack') {
                  showSuccessToast(data['text'])
                }else if (data['type'] == 'download_log'){
                    this.download(data['text'])
                } else if (data['type'] == 'history') {
                  showSuccessToast(this.props.username + ' joined the room')

                  this.setState({'pos_features': data['feedback_features']['posFeatures'],
                    'neg_features': data['feedback_features']['negFeatures']}, () => {
                    this.appendHistory(data['text'])
                  })

                  // this.appendHistory(data['text'])
                  // if (this.props.is_designer) {
                  if (this.state.is_designer) {this.updateNPCs(data['npcs'])}
                    if ('game_summary' in data) {
                      this.setState({summaryPostVal: data['game_summary']})
                    }
                  // if ('ws_id' in data){
                  //   localStorage.setItem('ws_id', data['ws_id'])
                  //   // this.ws_id = data['ws_id']
                  // }

                }else if(data['type'] == 'bot_history'){
                  this.appendResponse(data['text'], data['username'], data['message_id'])

                } else if (data['type'] == 'chat'){
                  this.appendResponse(data['text'], data['username'], data['message_id'])

                }else if(data['type'] == 'get_designer_input'){
                  this.appendResponse(data['text'], data['username'], data['message_id'])
                  this.setState({'postVal': data['suggestion']})
                  this.setState({'wait_for_designer_input': true,
                                      'npc_previous_text': data['text']})
                }
                else {
                  if ('game_summary' in data) {
                    this.setState({summaryPostVal: data['game_summary']})
                  }
                  if ('feedback_features' in data){
                    this.setState({'pos_features': data['feedback_features']['posFeatures'],
                      'neg_features': data['feedback_features']['negFeatures']}, () => {
                      this.appendResponse(data['text'], data['username'], data['message_id'])
                    })
                  }else {
                    this.appendResponse(data['text'], data['username'], data['message_id'])
                  }
                  if (this.state.is_designer && data['npcs']) {
                    this.updateNPCs(data['npcs'])
                  }
                }
              };
            }
    }

    download(data){
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'log.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    appendData(){
        if (this.state.postVal.trim().length !== 0) {
          let message = this.state.postVal.trim()
          let currentDate = new Date()
          let message_id = currentDate.getTime()
          let npc_previous_text = ""
            this.displayData.push(<OutgoingMsgs key={message_id} text={this.state.postVal} message_id={message_id}/>);
          let message_type = ""
          if (this.state.postVal.startsWith("/")) {
            if (this.state.postVal.startsWith("/chat")) {
              message_type = 'chat'
            }

          else if (this.state.postVal.startsWith('/bot_history')) {
              message_type = 'bot_history'
            }
          else if (this.state.postVal.startsWith('/undo')) {
              message_type = 'undo'
            }else{
            showErrorToast("command " + message + " not found")
              this.showInstructions()
            }
          }
          else if (this.state['wait_for_designer_input'] == true) {
              message_type = 'send_designers_input'
              npc_previous_text = this.state['npc_previous_text']
              this.setState({"wait_for_designer_input": false,
                                  "npc_previous_text": ""})
            }else{
            message_type = 'ask_chatbot'
          }
          let response = {'text': message, 'type': message_type, 'message_id': message_id/1000, 'npc_previous_text': npc_previous_text}
            this.ws.send(JSON.stringify(response))
            this.setState({
                showdata: this.displayData,
                initiate: false,
                postVal: ""
            });
            document.getElementById("msg_h").scrollTop = document.getElementById("msg_h").scrollHeight;
            // this.scrollMessageIntoView(message_id);
        }
    }

    handleChange(e) {
        let getTextAreaValue = e.target.value;
        this.setState({
            postVal: getTextAreaValue
        });
    }

  handleUpdateSummary(){
    if (this.ws.readyState === WebSocket.OPEN) {
      // console.log("ready")
          this.ws.send(JSON.stringify({ 'text': this.state.summaryPostVal, 'type': 'update_summary' }));
        } else {
          // Handle the case when WebSocket is not open
          showErrorToast('WebSocket is not open. Unable to send the message.');
        }
  }
    handleDownloadLog(){
        if (this.ws.readyState === WebSocket.OPEN){
          this.ws.send(JSON.stringify({'text': 'download_log', 'type': 'download_log'}))
        }else{
          // Handle the case when WebSocket is not open
          showErrorToast('WebSocket is not open. Unable to send the message.');
        }
    }

    handleSummaryChange(e){
      let getTextAreaValue = e.target.value;
        this.setState({
            summaryPostVal: getTextAreaValue
        });
    }

      handleSwitchChange = (itemId) => {

        itemId = "[ID] " + itemId.trim() + ":"
        this.setState((prevState) => {
        const { ctlNPCs } = prevState;
        const itemIndex = ctlNPCs.indexOf(itemId);

        let updatedCtlNPCs;
        if (itemIndex !== -1) {
          // If the itemId is already in ctlNPCs, remove it
          updatedCtlNPCs = ctlNPCs.filter((id) => id !== itemId);
        } else {
          // If the itemId is not in ctlNPCs, add it
          updatedCtlNPCs = [...ctlNPCs, itemId];
        }

        return { ctlNPCs: updatedCtlNPCs };
      }, () => {
    // This callback is executed after setState has taken effect
    this.ws.send(JSON.stringify({"text": "", "ctlNPCs" : this.state.ctlNPCs, "type": "update_ctlNPCs"}));
  });
    }

    render(){return(<div className="inbox_msg">

      {!this.props.is_designer ?(

        <div className="inbox_people">

            <div style={{'height': "760px"}}className="inbox_chat">


              {/*<div div className="d-flex align-items-center mb-0">*/}
              {/*  */}
              {/*</div>*/}

              <div div className="d-flex align-items-center mb-0">
                {/*<h4 ref={this.userID}>Please wait ...</h4>*/}
                <table className="table align-middle mb-0">
                  <thead className="table-dark table-hover">
                  <tr className={"text-center"}>
                    <th>Name</th>
                    <th>Room#</th>
                    <th>Password</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr className={"text-center"}>
                    <th>{this.props.username}</th>
                    <th>{this.props.room_number}</th>
                    <th>{this.props.room_pass}</th>

                  </tr>
                  </tbody>
                </table>
                {/*<RoomInfo roomNumber={this.props.room_number} roomPass={this.props.room_pass} username={this.props.username}/>*/}

              </div>

              <h5 className="text-center pt-3">Instructions</h5>
              <div className=" m-4 mt-0">
                <p>Welcome to the game chatroom! Here's how you can interact with the bot and enjoy the game:</p>
                <p>Use the following tags to structure your interactions:</p>
                <ul>
                  <li><strong>[Action]:</strong> Use this tag to describe your character's actions or intentions.</li>
                  <li><strong>[Words]:</strong> Use this tag to provide dialogue or words spoken by your character.</li>
                </ul>
                <p><strong>Example Player Turn:</strong></p>
                <pre className="bg-light p-3">
                  [Action] You swing open the door. <br></br>
                  [Words] Greetings!
                      </pre>
                <p>You can also use the <code>/chat</code> command to communicate with other players and the game
                  designer without interrupting the game flow.</p>
                <p>Interact creatively and collaboratively to weave an engaging story together.</p>
              </div>
              <h5 className="text-center pt-3">Warnings</h5>
              <div className="m-4 mt-0">
                  <p className="mb-4">
                      <strong>AI Responses:</strong> The game uses AI-powered models to generate responses. While efforts are made to ensure appropriate content, the responses might not always be perfect. If you come across any inappropriate content, please report it to the game designer.
                  </p>
                  <p className="mb-4">
                      <strong>Data Recording:</strong> Please note that your interactions, including both your input and the AI-generated responses, may be recorded for quality improvement and monitoring purposes. Please avoid sharing personal information in the chatroom.
                  </p>
              </div>
            </div>
          </div>
                ) : (
                  <div className="inbox_people">

            <div className="inbox_chat">


              <div className="d-flex align-items-center mb-0">
                {/*<h4 ref={this.userID}>Please wait ...</h4>*/}
                <table className="table align-middle mb-0">
                  <thead className="table-dark table-hover">
                  <tr className={"text-center"}>
                    <th>Name</th>
                    <th>Room#</th>
                    <th>Password</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr className={"text-center"}>
                    <th>{this.props.username}</th>
                    <th>{this.props.room_number}</th>
                    <th>{this.props.room_pass}</th>

                  </tr>
                  </tbody>
                </table>
                {/*<RoomInfo roomNumber={this.props.room_number} roomPass={this.props.room_pass} username={this.props.username}/>*/}
              </div>
                  <h5 className="text-center pt-3">Plot</h5>
              <div className="input_text p-2">
                    <textarea className="write_msg textAreaSummary_player"  onKeyDown={event => {
                      if (event.key === 'Enter' && event.shiftKey) {
                            // Insert a newline character (\n) instead of preventing the default behavior
                            const summarytextarea = event.target;
                            const summarycurrentValue = summarytextarea.value;
                            const summaryselectionStart = summarytextarea.selectionStart;
                            const summaryselectionEnd = summarytextarea.selectionEnd;
                            const summaryNewValue =
                              summarycurrentValue.substring(0, summaryselectionStart) +
                              '\n' +
                              summarycurrentValue.substring(summaryselectionEnd);
                            this.setState({
                              summaryPostVal: summaryNewValue
                            });
                            event.preventDefault(); // Prevent the default behavior of newline being added
                          }

                    }} placeholder={this.state.summaryPostVal ? "" : "Game plot is empty. You may write your own game plot and update it by pressing Update Plot button."} value={this.state.summaryPostVal} ref={this.summaryTextareaRef} onChange={this.handleSummaryChange}/>
                </div>
              <h5 className="text-center pt-3">
            NPC Hidden States (Latest)
          </h5>
              <MDBCol>

              <MDBCard style={{ backgroundColor: "#eee", overflow: "auto", minWidth: "260px"}}>
                <CollapseList ref={this.collapseListRef} ctlNPCs={this.state.ctlNPCs} handleSwitchChange={this.handleSwitchChange}/>

              </MDBCard>
              </MDBCol>

                {/*<div className="chat_list active_chat">*/}
                {/*    <div className="chat_people">*/}
                {/*        <div className="chat_ib">*/}
                {/*            <h3>Introduction </h3>*/}
                {/*            <p> Welcome! (populate) </p>*/}
                {/*            <br/>*/}
                {/*            <h3>Warning!</h3>*/}
                {/*            <p> Since you would be interacting with an AI agent that generates freeform language, there*/}
                {/*                is a small chance that you might see some inappropriate language. However, in our initial*/}
                {/*                experiments with this model, we have found that as long as the participant's interaction*/}
                {/*                is restricted to game relevant text, this risk is very minimal.</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
            {/*<button className="button-25" role="button" onClick={() => {this.endChat()}}>End</button>*/}

              <MDBRow className="justify-content-center m-2 ">
                <MDBCol className={"m-1 mt-0 p-0"}>
                  <MDBBtn color="success" className="w-100" onClick={this.handleUpdateSummary}>Update Plot</MDBBtn>
                </MDBCol>
                <MDBCol className={"m-1 mt-0 p-0"}>
                  <MDBBtn color="danger" className="w-100" onClick={this.handleDownloadLog}>Download Log</MDBBtn>
                </MDBCol>
              </MDBRow>

          </div>)}

        <div className="mesgs">

            <div className="msg_history" id={"msg_h"}>
                {this.displayData}
            </div>
            <div className="type_msg">
                <div className="input_msg_write">
                    <textarea className="write_msg" onKeyDown={event => {
                      if (event.key === 'Enter' && event.shiftKey) {
                            // Insert a newline character (\n) instead of preventing the default behavior
                            const textarea = event.target;
                            const currentValue = textarea.value;
                            const selectionStart = textarea.selectionStart;
                            const selectionEnd = textarea.selectionEnd;
                            const newValue =
                              currentValue.substring(0, selectionStart) +
                              '\n' +
                              currentValue.substring(selectionEnd);
                            this.setState({
                              postVal: newValue
                            });
                            event.preventDefault(); // Prevent the default behavior of newline being added
                          }
                        else if (event.key === 'Enter') {
                            event.preventDefault()
                            this.appendData()
                        }
                    // }} placeholder="Type a message" value={this.state.postVal} onChange={this.handleChange}/>
                    }} placeholder={this.state.postVal ? "" : "Type a message"} value={this.state.postVal} onChange={this.handleChange}/>
                    <button className="msg_send_btn" type="button" onClick={this.appendData}><i className="fa fa-paper-plane-o" aria-hidden="true"></i></button>
                </div>
            </div>

    </div>

        <Toaster position="top-right" reverseOrder={false} />
        </div>

    )
    }
}

export default Mesgs;
