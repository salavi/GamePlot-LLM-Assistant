import React, {useEffect, useState} from 'react';
import {useNavigate, useLocation} from "react-router-dom";
import Mesgs from "./Mesgs";

export function parseFeedbackFeatures(feedbackFeatures) {
  function processFeaturesList(inputString) {
    return inputString.split(',').filter(item => item.trim() !== '');
  }

  let feedbackLines = [""]
  if (feedbackFeatures !== undefined) {
    feedbackLines = feedbackFeatures.split('\n');
  }

  let posFeatures = processFeaturesList(feedbackLines[0]);
  if (posFeatures.length === 0) {
    posFeatures = ['Fluent', 'Relevant'];
  }

  let negFeatures = feedbackLines.length > 1 ? processFeaturesList(feedbackLines[1]) : ['Irrelevant', 'Hateful'];

  if (negFeatures.length === 0) {
    negFeatures = ['Inconsistent', 'Hateful'];
  }
  return {posFeatures, negFeatures};
}

function MesgsWrapper(){
    // const { roomId, userId } = useParams();
  const location = useLocation()
  // const [finishStatus, setfinishStatus] = useState(false);
  const state = location.state
  let navigate  = useNavigate();

  // const onBackButtonEvent = (e) => {
  //       e.preventDefault();
  //       if (!finishStatus) {
  //           if (window.confirm("Are you sure you want to go back? You will lose access to the " +
  //               "history of your previous interactions and start a new session")) {
  //               setfinishStatus(true)
  //               // your logic
  //               window.location.href = '/'
  //           } else {
  //               window.history.pushState(null, null, window.location.pathname);
  //               setfinishStatus(false)
  //           }
  //       }
  //   }
  //   useEffect(() => {
  //       window.history.pushState(null, null, window.location.pathname);
  //       window.addEventListener('popstate', onBackButtonEvent);
  //       return () => {
  //           window.removeEventListener('popstate', onBackButtonEvent);
  //       };
  //   }, []);
  // let {posFeatures, negFeatures} = parseFeedbackFeatures(state.feedbackFeatures);

  return (
        <div>
            <Mesgs room_number={state.room_number} username={state.username} room_pass={state.room_pass} is_designer={state.is_designer} navigate={navigate} />
        </div>
    );
}


export default MesgsWrapper;
