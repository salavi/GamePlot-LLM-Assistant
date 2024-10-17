import React from 'react'
import '../index.css';
import {
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBInput,
  MDBRow,
  MDBBtn,
  MDBModal,
  MDBModalBody,
  MDBModalHeader,
  MDBModalFooter,
  MDBModalContent,
  MDBModalDialog,
  MDBModalTitle,
  MDBCheckbox,
  MDBListGroup,
  MDBListGroupItem,
  MDBTextArea,
  MDBTooltip,

} from 'mdb-react-ui-kit';
import botImage from '../bot.png';
import {showErrorToast} from "./toastUtils";


class IncomingMsgs extends React.Component{
    constructor(props) {
        super(props);
        this.ws = props.ws
        this.text = props.text
        this.username = props.username
        this.message_id = props.message_id
        let today = new Date()
        if (this.props.message_id !== undefined)
            today = new Date(this.props.message_id * 1000)
        this.time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        this.date = today.toLocaleDateString('en-us',{day:'numeric',month:'short', year:'numeric'})
      const initialOptionsState = Object.fromEntries([...this.props.pos_features].map(option => [option, false]));
      const initialNegOptionsState = Object.fromEntries([...this.props.neg_features].map(option => [option, false]));

      this.state = {
        selectedIcon: null,
        hoverThumbsUp: false,
        hoverThumbsDown: false,
        hoverClipboard: false,
        hoverReset: false,
        isModalOpen: false,
        isNegModalOpen: false,
        showClipboard: false,
        feedbackOptions: initialOptionsState,
        additionalFeedback: '',
        feedbackNegOptions: initialNegOptionsState,
        additionalNegFeedback: '',
        prevIcon: null,
        posModalKey: "posModalKey",
        negModalKey: "negModalKey",
      };

      this.toggleModal = this.toggleModal.bind(this);
    }


  handleMouseOver = (icon) => {
    this.setState({ [`hover${icon}`]: true });
  };

  handleMouseOut = (icon) => {
    this.setState({ [`hover${icon}`]: false });
  };

  handleReset = () => {
    const resetFeedbackOptions = Object.fromEntries(
        [...this.props.pos_features].map(option => [option, false])
      );
    const resetFeedbackNegOptionsState = Object.fromEntries([...this.props.neg_features].map(option => [option, false]));

      this.setState({
        additionalFeedback: '',
        additionalNegFeedback: '',
        feedbackOptions: resetFeedbackOptions,
        feedbackNegOptions: resetFeedbackNegOptionsState,
        isPos: false,
        isNeg: false,
        selectedIcon: null,
        prevIcon: null,
        isModalOpen: false,
        isNegModalOpen: false,
        posModalKey: "posModalKey",
        negModalKey: "negModalKey"
      });

    const feedbackData = {
      message_id: this.message_id,
      type: 'reset'
    };


    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({'text': "feedback", 'type': 'feedback', 'feedback': feedbackData}));
    } else {
      // Handle the case when WebSocket is not open
      showErrorToast('WebSocket is not open. Unable to send the message.');
    }

  }


  handleClick = (icon) => {

    this.setState((prevState) => ({
      selectedIcon: icon,
      // showClipboard: prevState.showClipboard || icon === 'thumbs-up' || icon === 'thumbs-down',
    }), ()=>{this.toggleModal();});

    // if (this.state.prevIcon && this.state.prevIcon !== icon) {
    //   // Create an object with all options set to false
    //   const resetFeedbackOptions = Object.fromEntries(
    //     [...this.props.pos_features, ...this.props.neg_features].map(option => [option, false])
    //   );
    //   this.setState({
    //     additionalFeedback: '',
    //     feedbackOptions: resetFeedbackOptions,
    //   });
    // }
    // this.setState({
    //   prevIcon: icon,
    // })

    // this.toggleModal();
    // Open the form modal if the clicked icon is not 'clipboard'
    // if (icon !== 'clipboard') {
    //   this.toggleModal();
    // }
  };

  toggleModal = () => {
    if (this.state.selectedIcon === "thumbs-up") {
      this.setState((prevState) => ({
        isModalOpen: !prevState.isModalOpen,
        isPos: true,
        posModalKey: "posModalKey1"
      }));
      if (this.state.isModalOpen) {
        this.sendFeedback()
      }
    } else if (this.state.selectedIcon === "thumbs-down"){
      this.setState((prevState) => ({
        isNegModalOpen: !prevState.isNegModalOpen,
        isNeg: true,
        negModalKey: "negModalKey1"
      }));
      if (this.state.isNegModalOpen) {
        this.sendFeedback()
      }
    }
  };

  saveFeedback = () => {
    this.sendFeedback();
    this.toggleModal();
  };

  sendFeedback() {
    const {selectedIcon} = this.state;
    // Construct JSON object based on the current state
    // const saFeedbackOptions = this.state.feedbackOptions.map(option => option || false);
    let additionalFeedback = this.state.additionalFeedback
    let options_ = this.state.feedbackOptions
    if (selectedIcon === "thumbs-down"){
      options_ = this.state.feedbackNegOptions
      additionalFeedback = this.state.additionalNegFeedback
    }
    const feedbackData = {
      message_id: this.message_id,
      type: selectedIcon, // 'thumbs-up' or 'thumbs-down'
      options: options_,
      additionalFeedback: additionalFeedback,
      message_text: this.text
    };


    // Use feedbackData as needed (e.g., send it to the server)
    // console.log(feedbackData);


    if (this.ws.readyState === WebSocket.OPEN) {
      let feedback = {}
      this.ws.send(JSON.stringify({'text': "feedback", 'type': 'feedback', 'feedback': feedbackData}));
    } else {
      // Handle the case when WebSocket is not open
      showErrorToast('WebSocket is not open. Unable to send the message.');
    }
  }

  handleCheckboxChange = (option) => {
    // Toggle the checkbox value in the feedbackOptions array
    this.setState((prevState) => {
      const feedbackOptions = { ...prevState.feedbackOptions, [option]: !prevState.feedbackOptions[option] };
      return { feedbackOptions };
    });
  };

  handleTextAreaChange = (event) => {
    // Update the additionalFeedback value in the state
    this.setState({ additionalFeedback: event.target.value });
  };

  handleNegCheckboxChange = (option) => {
    this.setState((prevState) => {
      const feedbackNegOptions = { ...prevState.feedbackNegOptions, [option]: !prevState.feedbackNegOptions[option] };
      return { feedbackNegOptions };
    });
  }

  handleNegTextAreaChange = (event) => {
    // Update the additionalFeedback value in the state
    this.setState({ additionalNegFeedback: event.target.value });
  };



  render() {

    const {
      selectedIcon,
      hoverThumbsUp,
      hoverThumbsDown,
      hoverReset,
      hoverClipboard,
      isModalOpen,
      isNegModalOpen,
      isPos,
      isNeg,
      showClipboard,
      posModalKey,
      negModalKey,
    } = this.state;

    return(
      <div className="incoming_msg" id={this.props.message_id}>
      {/*<div className="d-flex justify-content-between">*/}
        <div className="d-flex flex-row">
          <img src={botImage} alt="avatar"

               className="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60"/>
          {/*<div className="pt-1">*/}
          <div className="received_msg">

            <div className="received_withd_msg">

            <p className="fw-bold mb-0">{this.username}</p>

            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{this.text}</p>


              {/*<div className="row g-3">*/}
              {/*<MDBContainer className="p-3 px-0 my-3 d-flex flex-column mt-0">*/}
              {/*<MDBRow className=" m-1 mb-1 mt-0">*/}
              {/*  <MDBCol className="px-2 mt-2">*/}
              {/*  <MDBBtn*/}
              {/*    onClick={() => this.handleFeedback('positive')}*/}
              {/*    color="dark"*/}
              {/*    disabled={buttonsDisabled}*/}
              {/*    className={`like-btn ${liked ? 'active' : ''} w-50`}*/}
              {/*  >*/}
              {/*    <MDBIcon far icon="thumbs-up" />*/}
              {/*  </MDBBtn>*/}
              {/*  </MDBCol>*/}
              {/*  <MDBCol className="px-2 mt-2">*/}
              {/*  <MDBBtn*/}
              {/*    onClick={() => this.handleFeedback('negative')}*/}
              {/*    color="dark"*/}
              {/*    disabled={buttonsDisabled}*/}
              {/*    className={`dislike-btn ${disliked ? 'active' : ''} w-50`}*/}
              {/*  >*/}
              {/*    <MDBIcon far icon="thumbs-down" />*/}
              {/*  </MDBBtn>*/}
              {/*  </MDBCol>*/}
              {/*  <MDBCol className="px-2 mt-2">*/}
              {/*  {showMoreFeedbackButton && (*/}
              {/*    <MDBBtn onClick={this.handleMoreFeedback} color="dark" className="more-feedback-btn w-50">*/}
              {/*      <MDBIcon far icon="clipboard"/>*/}
              {/*    </MDBBtn>*/}

              {/*  )}*/}
              {/*  </MDBCol>*/}
              {/*</MDBRow>*/}
              {/*</MDBContainer>*/}

              {/*</div>*/}
              {/*<div className="d-flex justify-content-between mb-2 m-1">*/}
              {/*  <span className="time_date"> {this.time}   | {this.date}</span>*/}
              {/*  <div className="d-flex flex-row align-items-center ">*/}
              {/*    <div className="text-secondary">*/}
              {/*  <MDBIcon*/}
              {/*    far*/}
              {/*    icon="thumbs-up mx-2 fa-s"*/}
              {/*    // style={{ marginTop: "-0.16rem" }}*/}
              {/*  />*/}
              {/*    </div>*/}

              {/*    <div className="text-secondary">*/}
              {/*    <MDBIcon*/}
              {/*      far*/}
              {/*      icon="thumbs-down mx-2 fa-s"*/}
              {/*      // style={{ marginTop: "-0.16rem" }}*/}
              {/*    />*/}
              {/*    </div>*/}
              {/*    */}
              {/*    <div className="text-secondary">*/}
              {/*    <MDBIcon*/}
              {/*      far*/}
              {/*      icon="clipboard mx-2"*/}
              {/*      // style={{ marginTop: "-0.16rem" }}*/}
              {/*    />*/}
              {/*    </div>*/}

              {/*</div>*/}


              {/*</div>*/}

              <div className="d-flex justify-content-between mb-2 m-1">
        <span className="time_date">
          {this.time} | {this.date}
        </span>
                {this.username === "NPC" && (
                  <div className="d-flex flex-row align-items-center">

                  <div
                    className={`icon-container ${
                      isPos ? 'text-success' : 'text-secondary'
                    } ${hoverThumbsUp ? 'text-dark' : ''}`}
                    onMouseOver={() => this.handleMouseOver('ThumbsUp')}
                    onMouseOut={() => this.handleMouseOut('ThumbsUp')}
                    onClick={() => this.handleClick('thumbs-up')}
                  >
                    <MDBIcon far icon="thumbs-up mx-2 fa-s" />
                  </div>

                  <div
                    className={`icon-container ${
                      isNeg ? 'text-danger' : 'text-secondary'
                    } ${hoverThumbsDown ? 'text-dark' : ''}`}
                    onMouseOver={() => this.handleMouseOver('ThumbsDown')}
                    onMouseOut={() => this.handleMouseOut('ThumbsDown')}
                    onClick={() => this.handleClick('thumbs-down')}
                  >
                    <MDBIcon far icon="thumbs-down mx-2 fa-s" />
                  </div>
                    <div
                      className={`icon-container ${
                        'text-secondary'
                      } ${hoverReset ? 'text-dark' : ''}`}
                      onMouseOver={() => this.handleMouseOver('Reset')}
                      onMouseOut={() => this.handleMouseOut('Reset')}
                      onClick={() => this.handleReset()}
                    >
                      <MDBIcon fas icon="eraser mx-2 fa-s" />
                    </div>


                  {/*{showClipboard && (*/}
                  {/*  <div*/}
                  {/*    className={`icon-container ${*/}
                  {/*      selectedIcon === 'clipboard' ? 'text-primary' : 'text-secondary'*/}
                  {/*    } ${hoverClipboard ? 'text-dark' : ''}`}*/}
                  {/*    onMouseOver={() => this.handleMouseOver('Clipboard')}*/}
                  {/*    onMouseOut={() => this.handleMouseOut('Clipboard')}*/}
                  {/*    onClick={this.openFormModal} // Call the function to open the form modal*/}
                  {/*  >*/}
                  {/*    <MDBIcon far icon="clipboard mx-2" />*/}
                  {/*  </div>*/}
                  {/*)}*/}

                  <MDBModal key={posModalKey} show={isModalOpen} tabIndex="-1" backdrop keyboard onClick={this.toggleModal}>
                    <MDBModalDialog onClick={(e) => e.stopPropagation()}>
                      <MDBModalContent>
                        <MDBModalHeader>
                          <MDBModalTitle>Provide Additional Feedback</MDBModalTitle>
                          <MDBBtn
                            className="btn-close"
                            color="none"
                            onClick={this.toggleModal}
                          ></MDBBtn>
                        </MDBModalHeader>
                        <MDBModalBody>
                            <div>
                              <div className="h6 mb-4">What do you like about the response?</div>
                              <div className="">Select all options that apply:</div>
                              <MDBListGroup style={{ minWidth: '22rem' }} light>
                                <MDBListGroupItem>
                                {this.props.pos_features.map((option, index) => (
                                  <MDBCheckbox key={index} label={option} onChange={() => this.handleCheckboxChange(option)}/>
                                ))}
                              </MDBListGroupItem>
                                <MDBListGroupItem>
                              <MDBTextArea label='Your additional feedback' id='textAreaExample' rows={4} onChange={this.handleTextAreaChange}/>
                                </MDBListGroupItem>
                              </MDBListGroup>
                              {/*</div>*/}
                            </div>

                        </MDBModalBody>

                        <MDBModalFooter>
                          <MDBBtn color="success" onClick={this.saveFeedback}>Submit</MDBBtn>
                        </MDBModalFooter>
                      </MDBModalContent>
                    </MDBModalDialog>
                  </MDBModal>

                    <MDBModal key={negModalKey} show={isNegModalOpen} tabIndex="-1" backdrop keyboard onClick={this.toggleModal}>
                      <MDBModalDialog onClick={(e) => e.stopPropagation()}>
                        <MDBModalContent>
                          <MDBModalHeader>
                            <MDBModalTitle>Provide Additional Feedback</MDBModalTitle>
                            <MDBBtn
                              className="btn-close"
                              color="none"
                              onClick={this.toggleModal}
                            ></MDBBtn>
                          </MDBModalHeader>
                          <MDBModalBody>
                              <div>
                                <div className="h6 mb-4">What was the issue with the response? How could it be improved?</div>
                                <div className="">Select all options that apply:</div>
                                <MDBListGroup style={{ minWidth: '22rem' }} light>
                                  <MDBListGroupItem>
                                    {this.props.neg_features.map((option, index) => (
                                      <MDBCheckbox key={index} label={option} onChange={() => this.handleNegCheckboxChange(option)} />
                                    ))}
                                  </MDBListGroupItem>
                                  <MDBListGroupItem>
                                    <MDBTextArea label='Your additional feedback' id='textAreaExample' rows={4} onChange={this.handleNegTextAreaChange}/>
                                  </MDBListGroupItem>
                                </MDBListGroup>
                              </div>

                          </MDBModalBody>

                          <MDBModalFooter>
                            <MDBBtn color="success" onClick={this.saveFeedback}>Submit</MDBBtn>
                          </MDBModalFooter>
                        </MDBModalContent>
                      </MDBModalDialog>
                    </MDBModal>

                </div>
                )}
              </div>

            </div>

          </div>

          </div>

          {/*</div>*/}

        {/*</div>*/}
       {/*</div>*/}
      </div>
        );
    }
}

export default IncomingMsgs
