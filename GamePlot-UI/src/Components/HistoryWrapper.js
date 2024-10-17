import React from 'react';
import {useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import IncomingMsgs from "./IncomingMsgs";
import OutgoingMsgs from "./OutgoingMsgs";

import './history.css'
import InitialPrompt from "./InitialPrompt";



function HistoryWrapper(){

    const [finishStatus, setfinishStatus] = useState(false);
    const location = useLocation();
    const [userID, setUserID] = useState("");
    const [history_log, setHistoryLog] = useState([]);

    useEffect(() => {
        if (localStorage.getItem("userID"))
            setUserID(localStorage.getItem('userID'))
    }, [])
    useEffect(() => {
        if (localStorage.getItem("history_log"))
            setHistoryLog(JSON.parse(localStorage.getItem('history_log')))
    },[])


    const onBackButtonEvent = (e) => {
        e.preventDefault();
        if (!finishStatus) {
            if (window.confirm("Are you sure you want to go back? You will lose access to the " +
                "history of your previous interactions and start a new session")) {
                setfinishStatus(true)
                // your logic
                window.location.href = '/'
            } else {
                window.history.pushState(null, null, window.location.pathname);
                setfinishStatus(false)
            }
        }
    }
    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', onBackButtonEvent);
        return () => {
            window.removeEventListener('popstate', onBackButtonEvent);
        };
    }, []);

    let displayData = []
    function fill_history(history_log){

        for (let i=0; i<history_log.length; i++){
            if (i===0){
                displayData.push(<div style={{whiteSpace: "pre-line"}}><InitialPrompt  text={history_log[0]}/></div>)
            }else if (history_log[i]['tag'] === 'user'){
                displayData.push(<div className='messages'><OutgoingMsgs text={history_log[i]['message']} time={history_log[i]['time']}/></div>)
            }else if (history_log[i]['tag'] === 'system') {
                displayData.push(<div style={{whiteSpace: "pre-line"}} className='messages'><IncomingMsgs text={history_log[i]['message']} time={history_log[i]['time']}/></div>)
            }
        }

    }

    fill_history(history_log)

    return (
        <div className="inbox_msg1">

                <div className="msg_history">
                    <div className='messages1'>
                        <div className="outgoing_msg1">
                            <div className="initial_prompt">
                                <h4>Instructions:</h4>
                                <p>Please do not close or refresh this page. You need the data displayed bellow to answer the post experiment questionnaire.
                                    Please go to <a href="https://forms.office.com/r/9JfB7syzpG" target="_blank">this</a> form and fill the post experiment questionnaire using your UserID. </p>
                                <div className="userID">
                                    UserID: <b>{userID}</b>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*{displayData}*/}

                </div>

        </div>

    );


}

export default HistoryWrapper;
