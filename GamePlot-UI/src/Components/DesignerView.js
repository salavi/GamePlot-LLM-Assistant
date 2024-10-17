import React from 'react'
// import '../index.css';
import './designer.css'
import OutgoingMsgs from "./OutgoingMsgs";
import IncomingMsgs from "./IncomingMsgs";
import CollapseList from './CollapseList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toast, { Toaster } from 'react-hot-toast';
import {faExclamationCircle} from "@fortawesome/free-solid-svg-icons";

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import {parseFeedbackFeatures} from "./MesgsWrapper"



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
  MDBCollapse, MDBInput
} from "mdb-react-ui-kit";
import RoomInfo from "./RoomInfo";

// const SERVER = "http://localhost:8000";
// const SERVER = 'https://gameplot-server.azurewebsites.net';
const SERVER = process.env.REACT_APP_BACKEND_HOST_HTTP;

// const SERVER = 'ws://localhost:5000/websocket';
const MANDATORY_NUM_TURNS = 20
class DesignerView extends React.Component{
    constructor() {
        super();
        this.displayData = [];
        // this.userID = React.createRef();
        this.state = {
            initiate: true,
            showData: this.displayData,
            postVal:"",
            userID: "NONE",
            history: [],
            summaryPostVal: "",
            feedbackPostVal: ""
            // room_pass: this.props.room_pass,
            // room_number: this.props.room_number,
        }
        this.textareaRef = React.createRef();
        this.summaryTextareaRef = React.createRef();
        this.feedbackTextareaRef = React.createRef();
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.handleDownload = this.handleDownload.bind(this);
        this.handleCreateGame = this.handleCreateGame.bind(this);
        this.handleGenerate = this.handleGenerate.bind(this);
        this.handleSummarize = this.handleSummarize.bind(this);

        // this.appendData = this.appendData.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSummaryChange = this.handleSummaryChange.bind(this);
        this.handleFeedbackChange = this.handleFeedbackChange.bind(this);
        // this.appendResponse = this.appendResponse.bind(this);

        // this.appendHistory = this.appendHistory.bind(this)
    }

    handleChange(e) {
        let getTextAreaValue_1 = e.target.value;
        this.setState({
            postVal: getTextAreaValue_1
        });
    }

    handleSummaryChange(e){
      let getTextAreaValue_2 = e.target.value;
        this.setState({
            summaryPostVal: getTextAreaValue_2
        });
    }

    handleFeedbackChange(e){
      let getTextAreaValue_3 = e.target.value;
      this.setState({
        feedbackPostVal: getTextAreaValue_3
      });
    }


    handleGenerate(){

      fetch(SERVER+'/bot', {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({'text': this.textareaRef.current.value, 'request': 'generate_response'} ),
            }).then((response) => response.json())
              .then((response) => {
                if (response['message'] == 'OK'){
                  let data = JSON.parse(response["data"])

                  this.setState({"postVal": this.state.postVal + '\n\n' + data['response']})

                }else {
                      toast.error( response.message, {
                        style: {
                          padding: '16px',
                          color: '#ffffff',
                          background: '#a2163f',

                        },
                        iconTheme: {
                          primary: '#ffffff',
                          secondary: '#a2163f',
                        },
                      });
                }
              })
              .catch((error) => console.error('Error:', error));

    }

    handleCreateGame(){

      if (this.state.feedbackPostVal.trim().split("\n").length > 2){
        alert("feedback features list has more than 2 lines")
      }else if (window.confirm("Are you sure you want to leave this page?")) {
                // localStorage.setItem("userID", this.state.userID);
                // localStorage.setItem("history_log", JSON.stringify(this.state.history));
                // this.props.navigate('/history', {state: {userID: this.state.userID, history_log: this.state.history}})
              const {posFeatures, negFeatures} = parseFeedbackFeatures(this.state.feedbackPostVal)
              fetch(SERVER + '/create-room', {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                "username": this.props.username,
                "room_number": "",
                "room_pass": "",
                "is_designer": true,
                "game_story": this.state.postVal,
                "game_summary": this.state.summaryPostVal,
                "feedback_features": {"posFeatures": posFeatures, "negFeatures": negFeatures}
              }),
            }).then((response) => response.json())
              .then((response) => {
                if (response['message'] == 'OK'){
                  let data = JSON.parse(response["data"])
                  // console.log(data)
                  this.props.navigate('/game/${room_number}/${username}', {state:{room_number: data['room_number'],
                        username: data['username'],
                        room_pass:data['room_pass'],
                        is_designer: true,
                        feedbackFeatures: this.state.feedbackPostVal
                        // game_summary: this.summaryTextareaRef.current.value,
                        // is_designer: true
                  }})
                }else {
                      toast.error( response.message, {
                        style: {
                          padding: '16px',
                          color: '#ffffff',
                          background: '#a2163f',

                        },
                        iconTheme: {
                          primary: '#ffffff',
                          secondary: '#a2163f',
                        },
                      });
                }
              })
              .catch((error) => console.error('Error:', error));
            }
    }

    handleSummarize = (plot) =>{

      this.setState({
        summaryPostVal: "Please wait, it may take few seconds to get a response from the server ..."
      })

      fetch(SERVER + '/bot', {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({'text': this.textareaRef.current.value, 'request': 'summarize', 'method': plot} ),
            }).then((response) => response.json())
              .then((response) => {
                if (response['message'] == 'OK'){
                  let data = JSON.parse(response["data"])

                  // this.summaryTextareaRef.current.value = data['response']
                  this.setState({summaryPostVal: data['response']})

                }else {
                      toast.error( response.message, {
                        style: {
                          padding: '16px',
                          color: '#ffffff',
                          background: '#a2163f',

                        },
                        iconTheme: {
                          primary: '#ffffff',
                          secondary: '#a2163f',
                        },
                      });
                }
              })
              .catch((error) => console.error('Error:', error));

    }

    handleFileUpload = (event) => {
      // console.log("hello")
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      let fileContent = e.target.result;
      this.setState({ postVal: fileContent });

    };
    reader.readAsText(file);
  };

    handleDownload = () => {
      // console.log("download")
      const game_story = this.textareaRef.current.value;
      const game_summary = this.summaryTextareaRef.current.value;

      function download(value, file_name) {
        const element = document.createElement('a');
        const file = new Blob([value], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = file_name;
        document.body.appendChild(element); // Required for Firefox
        element.click();
        document.body.removeChild(element);
      }

      download(game_story, 'game_story.txt');
      download(game_summary, 'game_plot.txt');
    }
    render(){return(<div className="inbox_msg">

          <div className="inbox_people">

            <div className="inbox_chat">
              <div div className="d-flex align-items-center">
                {/*<h4 ref={this.userID}>Please wait ...</h4>*/}
                <table className="table align-middle mb-0">
                  <thead className="table-dark table-hover">
                  <tr className={"text-center"}>
                    <th>Name</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr className={"text-center"}>
                    <th>{this.props.username}</th>
                  </tr>
                  </tbody>
                </table>
                {/*<RoomInfo roomNumber={this.props.room_number} roomPass={this.props.room_pass} username={this.props.username}/>*/}

              </div>

              <div className="row g-3">
                <MDBContainer className="p-3 my-3 d-flex flex-column mt-0">
                  {/*<input type="file"/>*/}
                {/*  <label color="light" for="files" className="btn">Select Image</label>*/}
                {/*<input  type="file" style={{visibility: "hidden"}} onChange={this.handleFileUpload}></input>*/}

                  <MDBRow className="justify-content-center m-1 mb-0 mt-2">
                    {/*<MDBCol className="px-2 mt-">*/}
                    <MDBCol className="px-2 mt-2">
                  <MDBBtn  className="w-100" onClick={this.handleCreateGame}><i className="fas fa-gamepad mr-2"></i> Create Game </MDBBtn>
                    </MDBCol>
                    <MDBCol className="px-2 mt-2">
                  <MDBBtn color="success" className="w-100" onClick={this.handleGenerate}><i className="fas fa-cogs mr-2"></i> Generate </MDBBtn>
                    </MDBCol>

                    {/*</MDBCol>*/}
                  </MDBRow>
                  <MDBRow className="justify-content-center m-1 mb-1 mt-0">
                    <MDBCol className="px-2 mt-2">
                  <MDBBtn color="info" className="w-100" onClick={() => this.handleSummarize(1)}><i className="fas fa-cogs mr-2"></i> Plot 1 </MDBBtn>
                      </MDBCol>
                    <MDBCol className="px-2 mt-2">
                  <MDBBtn color="info" className="w-100" onClick={() => this.handleSummarize(2)}><i className="fas fa-cogs mr-2"></i> Plot 2 </MDBBtn>
                      </MDBCol>
                    </MDBRow>
                  <MDBRow className="justify-content-center m-1 mb-1 mt-0">
                    <MDBCol className="px-2 mt-2">
                  <MDBBtn  color="light" className="w-100" onClick={this.handleDownload}><i className="fas fa-download mr-2"></i> Download</MDBBtn>
                      </MDBCol>
                    {/*<MDBCol className="px-2 mt-2">*/}
                  </MDBRow>
                  <MDBBtn color="light" className="p-0 mb-2 w-100">
                    <label as="label" htmlFor="files" className="btn m-0 text-center d-flex align-items-center justify-content-center" >
                      <i className="fas fa-upload mr-2"></i>Upload</label>
                      <span  ></span>
                      </MDBBtn>
                  <div className="remove_line">
                    <MDBInput type="file" id="files"
                      className="position-absolute invisible" onChange={this.handleFileUpload}/>
                    {/*  </MDBCol>*/}
                    {/*</MDBRow>*/}
                  </div>
                  <div>
                  <h4 className="text-center pt-3">Plot</h4>
                <div className="input_text">
                    <textarea className="write_msg textAreaSummary"  onKeyDown={event => {
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

                    }} placeholder={this.state.summaryPostVal ? "" : "Press PLOT 1 or PLOT 2 to populate this section based on your game story.\nYou may edit the generated Game Plot before creating the game."} value={this.state.summaryPostVal} ref={this.summaryTextareaRef} onChange={this.handleSummaryChange}/>
                </div>

                    <h4 className="text-center pt-3">Feedback Features</h4>
                    <div className="input_text">
                    <textarea className="write_msg textAreaFeedback"  onKeyDown={event => {
                      if (event.key === 'Enter' && event.shiftKey) {
                        // Insert a newline character (\n) instead of preventing the default behavior
                        const feedbacktextarea = event.target;
                        const feedbackcurrentValue = feedbacktextarea.value;
                        const feedbackselectionStart = feedbacktextarea.selectionStart;
                        const feedbackselectionEnd = feedbacktextarea.selectionEnd;
                        const feedbackNewValue =
                          feedbackcurrentValue.substring(0, feedbackselectionStart) +
                          '\n' +
                          feedbackcurrentValue.substring(feedbackselectionEnd);
                        this.setState({
                          feedbackPostVal: feedbackNewValue
                        });
                        event.preventDefault(); // Prevent the default behavior of newline being added
                      }

                    }} placeholder={this.state.feedbackPostVal ? "" : "Feel free to specify the characteristics you " +
                      "wish to assess in the game room questionnaire. Kindly enumerate favorable traits " +
                      "in the initial line, using commas for separation, and unfavorable traits in the subsequent " +
                      "line, also separated by commas. For instance:\n" +
                      "positive1, positive2, positive3, positive4\n" +
                      "negative1, negative2, negative3, negative4"} value={this.state.feedbackPostVal} ref={this.feedbackTextareaRef} onChange={this.handleFeedbackChange}/>
                    </div>

                    </div>

            </MDBContainer>
            </div>

            </div>

        </div>

        <div className="mesgs">

            {/*<div className="msg_history" id={"msg_h"}>*/}
            {/*    {this.displayData}*/}
            {/*</div>*/}
            {/*<div className="type_msg">*/}

                <div className="input_text">
                    <textarea className="write_msg textAreaGame" onKeyDown={event => {
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

                    }} placeholder={this.state.postVal ? "" : "Start your game story here. You may follow the following template. Remove everything before the 'Opening story:'.\n\n" +
                      "Opening story: 'You may leave this empty or write an opening story for your game'\n\nInstructions: 'You may leave this empty or write a set of instructions that you want the AI model to follow.\n\n" +
                      "Game: First turn of the game (unless the player initiates the interaction).\n\nScene: optional, if you want to add a scene or any other arguments\n" +
                      "[ID] NPC name:\n" +
                      "[Persona] or any other non essential tags (thoughts, mood, etc.) separated by a newline\n" +
                      "[Action] NPC action\n" +
                      "[Words] NPC words\n\n" +
                      "Player:\n\n" +
                      "[Action] Player action\n" +
                      "[Words] Player word\n\nGame:\n\n" +
                      "Warnings:\n" +
                      "AI Responses: The game uses AI-powered models to generate responses. While efforts are made to ensure appropriate content, the responses might not always be perfect. If you come across any inappropriate content, please report it to the game designer.\n" +
                      "\n" +
                      "Data Recording: Please note that your interactions, including both your input and the AI-generated responses, may be recorded for quality improvement and monitoring purposes." +
                      ""} value={this.state.postVal} ref={this.textareaRef} onChange={this.handleChange}/>
                </div>

            </div>

    {/*</div>*/}

        </div>

    )
    }
}

export default DesignerView;
